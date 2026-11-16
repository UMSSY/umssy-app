import type { Prisma } from '../../../prisma/client.js';

export const EVENT_PASS_LIFECYCLE_FIXTURES = [
  {
    eventId: 'fb69db6e-ded6-4eed-85ef-6135cf88fad4',
    registrationId: 'cf8b95fd-f796-4c9b-8797-ec7f50774442',
    title: '[QA 08.5] Pase vigente',
    dayOffset: 1,
  },
  {
    eventId: '66f39ba1-ebc1-42b9-9169-e773f2eb3d2b',
    registrationId: '0e4d2465-7346-4712-a933-4cb930b46677',
    title: '[QA 08.5] Pase finalizado por horario',
    dayOffset: -1,
  },
] as const;

function getBoliviaCalendarDate(now: Date, dayOffset: number): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find(({ type }) => type === 'year')?.value);
  const month = Number(parts.find(({ type }) => type === 'month')?.value);
  const day = Number(parts.find(({ type }) => type === 'day')?.value);

  return new Date(Date.UTC(year, month - 1, day + dayOffset));
}

export async function seedEventPassLifecycleEvents(
  tx: Prisma.TransactionClient,
  {
    createdById,
    categoryId,
    modalityId,
    originId,
    statusId,
    now = new Date(),
  }: {
    createdById: string;
    categoryId: string;
    modalityId: string;
    originId: string;
    statusId: string;
    now?: Date;
  },
): Promise<number> {
  for (const fixture of EVENT_PASS_LIFECYCLE_FIXTURES) {
    const eventDate = getBoliviaCalendarDate(now, fixture.dayOffset);
    await tx.event.upsert({
      where: { id: fixture.eventId },
      update: {
        title: fixture.title,
        description:
          'Taller ficticio para validar pases vigentes y finalizados en QA.',
        instructorName: 'Equipo QA',
        eventDate,
        startTime: new Date('1970-01-01T09:00:00.000Z'),
        endTime: new Date('1970-01-01T10:00:00.000Z'),
        location: 'Aula 101, Facultad de Ciencias y Tecnología',
        capacity: 30,
        supportThreshold: 0,
        categoryId,
        modalityId,
        originId,
        statusId,
        createdById,
      },
      create: {
        id: fixture.eventId,
        title: fixture.title,
        description:
          'Taller ficticio para validar pases vigentes y finalizados en QA.',
        instructorName: 'Equipo QA',
        eventDate,
        startTime: new Date('1970-01-01T09:00:00.000Z'),
        endTime: new Date('1970-01-01T10:00:00.000Z'),
        location: 'Aula 101, Facultad de Ciencias y Tecnología',
        capacity: 30,
        supportThreshold: 0,
        categoryId,
        modalityId,
        originId,
        statusId,
        createdById,
      },
    });
  }
  return EVENT_PASS_LIFECYCLE_FIXTURES.length;
}
