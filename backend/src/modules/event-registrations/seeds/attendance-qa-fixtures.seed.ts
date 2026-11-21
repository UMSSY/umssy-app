import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import type { Prisma, PrismaClient } from '../../../prisma/client.js';
import { createSeedClient } from '../../../common/database/seed-client.js';

export const ATTENDANCE_QA_EVENT_IDS = {
  sundayPrimary: '914f52b0-47f0-49b0-925a-d6783861693a',
  sundaySecond: 'ae15ec2f-36fd-4b1f-a517-a33d271a917e',
  monday: '73f2a48c-e823-4a9a-b8d9-cf312647d3e1',
  saturdayClosed: '263de24f-36bc-4520-b26f-20bb3cc074a6',
} as const;

// Keep the original event ID export for callers that used the first fixture.
export const ATTENDANCE_QA_EVENT_ID = ATTENDANCE_QA_EVENT_IDS.sundayPrimary;

export const ATTENDANCE_QA_CASES = {
  valid: {
    registrationId: '19480d81-231c-432b-bb87-fd05c74427c7',
    email: 'estudiante.1@umssy.test',
    event: 'sundayPrimary',
  },
  cancelled: {
    registrationId: '41c429ab-77c7-4b6f-83dd-42646bc0261b',
    email: 'titulado.1@umssy.test',
    event: 'sundayPrimary',
  },
  duplicate: {
    registrationId: '16c76334-82a4-48c5-97a3-31d73236f87b',
    email: 'mentor.a@umssy.test',
    event: 'sundayPrimary',
  },
  sundaySecond: {
    registrationId: 'd27b3425-3c57-4e14-9d04-bcc8bd0c963e',
    email: 'titulado.1@umssy.test',
    event: 'sundaySecond',
  },
  monday: {
    registrationId: '45b6d57c-355b-47ad-8d7d-108b94524ce8',
    email: 'estudiante.1@umssy.test',
    event: 'monday',
  },
  saturdayClosed: {
    registrationId: '86be2929-64fd-48c6-b35a-d9793d96c32b',
    email: 'sinpases@umss.edu.bo',
    event: 'saturdayClosed',
  },
} as const;

export const ATTENDANCE_QA_INVALID_REFERENCE = `v1:${'f'.repeat(64)}`;
const BOLIVIA_TIME_ZONE = 'America/La_Paz';
const DAY_MS = 24 * 60 * 60 * 1000;

function workshopDayInBolivia(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOLIVIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
}

function addDays(day: Date, amount: number): Date {
  return new Date(day.getTime() + amount * DAY_MS);
}

function nextSundayFrom(day: Date): Date {
  const daysUntilSunday = (7 - day.getUTCDay()) % 7;
  return addDays(day, daysUntilSunday);
}

function timeOfDay(value: string): Date {
  return new Date(`1970-01-01T${value}Z`);
}

function scheduledEvent(
  id: string,
  title: string,
  eventDate: Date,
  startTime: string,
  endTime: string,
  location: string,
) {
  return {
    id,
    title,
    description: 'Sesión práctica con ejercicios guiados y material de apoyo.',
    instructorName: 'Ing. Carlos Mendoza',
    eventDate,
    startTime: timeOfDay(startTime),
    endTime: timeOfDay(endTime),
    location,
    capacity: 30,
    supportThreshold: 0,
  };
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
  const [confirmed, cancelled] = await Promise.all([
    tx.registrationStatus.findUniqueOrThrow({ where: { title: 'Confirmada' } }),
    tx.registrationStatus.findUniqueOrThrow({ where: { title: 'Cancelada' } }),
  ]);

  const today = workshopDayInBolivia(now);
  const sunday = nextSundayFrom(today);
  const monday = addDays(sunday, 1);
  const saturday = addDays(sunday, -1);
  const shared = {
    categoryId: category.id,
    modalityId: modality.id,
    originId: origin.id,
    statusId: published.id,
    createdById: owner.id,
  };
  const events = {
    sundayPrimary: scheduledEvent(
      ATTENDANCE_QA_EVENT_IDS.sundayPrimary,
      'Taller de visualización de datos con Power BI',
      sunday,
      '20:00:00.000',
      '23:00:00.000',
      'Laboratorio de Innovación, Edificio A',
    ),
    sundaySecond: scheduledEvent(
      ATTENDANCE_QA_EVENT_IDS.sundaySecond,
      'Taller de gestión ágil de proyectos con Scrum',
      sunday,
      '21:00:00.000',
      '23:00:00.000',
      'Sala de reuniones, Edificio B',
    ),
    monday: scheduledEvent(
      ATTENDANCE_QA_EVENT_IDS.monday,
      'Taller de desarrollo de aplicaciones web con React',
      monday,
      '10:00:00.000',
      '12:00:00.000',
      'Laboratorio de computación, Edificio C',
    ),
    saturdayClosed: scheduledEvent(
      ATTENDANCE_QA_EVENT_IDS.saturdayClosed,
      'Taller de comunicación efectiva para equipos de trabajo',
      saturday,
      '10:00:00.000',
      '12:00:00.000',
      'Aula de capacitación, Edificio A',
    ),
  };

  for (const event of Object.values(events)) {
    const { id, ...data } = event;
    await tx.event.upsert({
      where: { id },
      update: { ...data, ...shared },
      create: { id, ...data, ...shared },
    });
  }

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
        eventId: events[fixture.event].id,
        userId: user.id,
        statusId: isCancelled ? cancelled.id : confirmed.id,
        cancelledAt: isCancelled ? now : null,
      },
      create: {
        id: fixture.registrationId,
        eventId: events[fixture.event].id,
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
        in: Object.values(ATTENDANCE_QA_CASES).map(
          (fixture) => fixture.registrationId,
        ),
      },
    },
  });
  await tx.eventAttendance.create({
    data: {
      registrationId: ATTENDANCE_QA_CASES.duplicate.registrationId,
      checkedInAt: now,
      checkedInById: owner.id,
      checkedInOffline: false,
      syncedAt: null,
    },
  });

  return {
    eventId: ATTENDANCE_QA_EVENT_IDS.sundayPrimary,
    events: Object.fromEntries(
      Object.entries(events).map(([key, event]) => [key, event.id]),
    ),
    schedule: {
      sunday,
      monday,
      saturdayClosed: saturday,
      attendanceOpensHoursBefore: 2,
    },
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
