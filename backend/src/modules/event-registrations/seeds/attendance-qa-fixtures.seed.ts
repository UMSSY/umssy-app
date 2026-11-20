import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import type { Prisma, PrismaClient } from '../../../prisma/client.js';
import { createSeedClient } from '../../../common/database/seed-client.js';

export const ATTENDANCE_QA_EVENT_ID = '914f52b0-47f0-49b0-925a-d6783861693a';
export const ATTENDANCE_QA_CASES = {
  valid: {
    registrationId: '19480d81-231c-432b-bb87-fd05c74427c7',
    email: 'estudiante.1@umssy.test',
  },
  cancelled: {
    registrationId: '41c429ab-77c7-4b6f-83dd-42646bc0261b',
    email: 'titulado.1@umssy.test',
  },
  duplicate: {
    registrationId: '16c76334-82a4-48c5-97a3-31d73236f87b',
    email: 'mentor.a@umssy.test',
  },
} as const;
export const ATTENDANCE_QA_INVALID_REFERENCE = `v1:${'f'.repeat(64)}`;

function workshopDayInBolivia(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
}

export async function seedAttendanceQaFixtures(
  tx: Prisma.TransactionClient,
  now: Date = new Date(),
) {
  const owner = await tx.user.findUniqueOrThrow({
    where: { email: 'prueba@umss.edu.bo' },
    select: { id: true },
  });
  const category = await tx.eventCategory.findUniqueOrThrow({
    where: { name: 'Tecnología' },
    select: { id: true },
  });
  const modality = await tx.eventModality.findUniqueOrThrow({
    where: { title: 'Presencial' },
    select: { id: true },
  });
  const origin = await tx.eventOrigin.findUniqueOrThrow({
    where: { title: 'Institucional' },
    select: { id: true },
  });
  const published = await tx.eventStatus.findUniqueOrThrow({
    where: { title: 'Publicado' },
    select: { id: true },
  });
  const confirmed = await tx.registrationStatus.findUniqueOrThrow({
    where: { title: 'Confirmada' },
    select: { id: true },
  });
  const cancelled = await tx.registrationStatus.findUniqueOrThrow({
    where: { title: 'Cancelada' },
    select: { id: true },
  });

  const event = {
    title: '[QA 08.12] Registro de asistencias',
    description: 'Taller ficticio de escaneo de pases para QA.',
    instructorName: 'Equipo QA',
    eventDate: workshopDayInBolivia(now),
    startTime: new Date('1970-01-01T00:00:00.000Z'),
    endTime: new Date('1970-01-01T23:59:59.999Z'),
    location: 'Aula QA',
    capacity: 30,
    supportThreshold: 0,
    categoryId: category.id,
    modalityId: modality.id,
    originId: origin.id,
    statusId: published.id,
    createdById: owner.id,
  };
  await tx.event.upsert({
    where: { id: ATTENDANCE_QA_EVENT_ID },
    update: event,
    create: { id: ATTENDANCE_QA_EVENT_ID, ...event },
  });

  const references: Record<keyof typeof ATTENDANCE_QA_CASES, string> =
    {} as Record<keyof typeof ATTENDANCE_QA_CASES, string>;
  for (const [name, fixture] of Object.entries(ATTENDANCE_QA_CASES) as [
    keyof typeof ATTENDANCE_QA_CASES,
    (typeof ATTENDANCE_QA_CASES)[keyof typeof ATTENDANCE_QA_CASES],
  ][]) {
    const user = await tx.user.findUniqueOrThrow({
      where: { email: fixture.email },
      select: { id: true },
    });
    const isCancelled = name === 'cancelled';
    const registration = await tx.eventRegistration.upsert({
      where: { id: fixture.registrationId },
      update: {
        eventId: ATTENDANCE_QA_EVENT_ID,
        userId: user.id,
        statusId: isCancelled ? cancelled.id : confirmed.id,
        cancelledAt: isCancelled ? now : null,
      },
      create: {
        id: fixture.registrationId,
        eventId: ATTENDANCE_QA_EVENT_ID,
        userId: user.id,
        statusId: isCancelled ? cancelled.id : confirmed.id,
        cancelledAt: isCancelled ? now : null,
        qrToken: randomBytes(32).toString('hex'),
      },
      select: { qrToken: true },
    });
    references[name] = `v1:${registration.qrToken}`;
  }

  await tx.eventAttendance.deleteMany({
    where: {
      registrationId: {
        in: [
          ATTENDANCE_QA_CASES.valid.registrationId,
          ATTENDANCE_QA_CASES.cancelled.registrationId,
        ],
      },
    },
  });
  await tx.eventAttendance.upsert({
    where: { registrationId: ATTENDANCE_QA_CASES.duplicate.registrationId },
    update: {
      checkedInAt: now,
      checkedInById: owner.id,
      checkedInOffline: false,
      syncedAt: null,
    },
    create: {
      registrationId: ATTENDANCE_QA_CASES.duplicate.registrationId,
      checkedInAt: now,
      checkedInById: owner.id,
      checkedInOffline: false,
      syncedAt: null,
    },
  });
  return {
    eventId: ATTENDANCE_QA_EVENT_ID,
    references: { ...references, invalid: ATTENDANCE_QA_INVALID_REFERENCE },
  };
}

export async function runAttendanceQaFixtures(client?: PrismaClient) {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Los fixtures QA no se pueden cargar en producción');
  const prisma = client ?? createSeedClient();
  try {
    return await prisma.$transaction((tx) => seedAttendanceQaFixtures(tx));
  } finally {
    if (!client) await prisma.$disconnect();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runAttendanceQaFixtures()
    .then((result) => {
      // Printed only by the explicit QA command; never by the regular seed or API.
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
