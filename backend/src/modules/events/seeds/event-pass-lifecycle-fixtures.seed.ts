import type { Prisma } from '../../../prisma/client.js';

export const EVENT_PASS_LIFECYCLE_FIXTURES = [
  {
    eventId: 'fb69db6e-ded6-4eed-85ef-6135cf88fad4',
    registrationId: 'cf8b95fd-f796-4c9b-8797-ec7f50774442',
    title: '[QA 08.5] Pase vigente',
    dayOffset: 0,
  },
  {
    eventId: '66f39ba1-ebc1-42b9-9169-e773f2eb3d2b',
    registrationId: '0e4d2465-7346-4712-a933-4cb930b46677',
    title: '[QA 08.5] Pase finalizado por horario',
    dayOffset: -1,
  },
] as const;

export interface RegistrationCancellationFixture {
  readonly eventId: string;
  readonly registrationId: string;
  readonly title: string;
  readonly dayOffset: number;
  readonly capacity: number;
  readonly initialStatus: 'confirmed' | 'cancelled';
}

export const REGISTRATION_CANCELLATION_FIXTURES: readonly RegistrationCancellationFixture[] =
  [
    {
      eventId: '7b1c2d3e-4f5a-4b6c-8d9e-0f1a2b3c4d01',
      registrationId: '8b1c2d3e-4f5a-4b6c-8d9e-0f1a2b3c4d01',
      title: '[QA 09.6] Taller vigente cancelable',
      dayOffset: 1,
      capacity: 20,
      initialStatus: 'confirmed',
    },
    {
      eventId: '7b1c2d3e-4f5a-4b6c-8d9e-0f1a2b3c4d02',
      registrationId: '8b1c2d3e-4f5a-4b6c-8d9e-0f1a2b3c4d02',
      title: '[QA 09.6] Taller con inscripcion cancelada',
      dayOffset: 1,
      capacity: 20,
      initialStatus: 'cancelled',
    },
    {
      eventId: '7b1c2d3e-4f5a-4b6c-8d9e-0f1a2b3c4d03',
      registrationId: '8b1c2d3e-4f5a-4b6c-8d9e-0f1a2b3c4d03',
      title: '[QA 09.6] Taller cupo lleno para liberacion',
      dayOffset: 1,
      capacity: 1,
      initialStatus: 'confirmed',
    },
    {
      eventId: '7b1c2d3e-4f5a-4b6c-8d9e-0f1a2b3c4d04',
      registrationId: '8b1c2d3e-4f5a-4b6c-8d9e-0f1a2b3c4d04',
      title: '[QA 09.6] Taller fuera de plazo de cancelacion',
      dayOffset: -1,
      capacity: 20,
      initialStatus: 'confirmed',
    },
  ];

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

function getBoliviaDateTimeParts(timestamp: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(timestamp);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
    second: getPart('second'),
    millisecond: timestamp.getUTCMilliseconds(),
  };
}

export function getUpcomingPassSchedule(now: Date) {
  let startsAt = new Date(now.getTime() + 5 * 60_000);
  let endsAt = new Date(startsAt.getTime() + 60_000);
  let start = getBoliviaDateTimeParts(startsAt);
  let end = getBoliviaDateTimeParts(endsAt);
  const closesNextDay =
    start.year !== end.year || start.month !== end.month || start.day !== end.day;

  if (closesNextDay) {
    startsAt = new Date(startsAt.getTime() + 60_000);
    endsAt = new Date(endsAt.getTime() + 60_000);
    start = getBoliviaDateTimeParts(startsAt);
    end = getBoliviaDateTimeParts(endsAt);
  }

  return {
    eventDate: new Date(Date.UTC(start.year, start.month - 1, start.day)),
    startTime: new Date(
      Date.UTC(
        1970,
        0,
        1,
        start.hour,
        start.minute,
        start.second,
        start.millisecond,
      ),
    ),
    endTime: new Date(
      Date.UTC(
        1970,
        0,
        1,
        end.hour,
        end.minute,
        end.second,
        end.millisecond,
      ),
    ),
  };
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
    const schedule =
      fixture.dayOffset === 0
        ? getUpcomingPassSchedule(now)
        : {
            eventDate: getBoliviaCalendarDate(now, fixture.dayOffset),
            startTime: new Date('1970-01-01T09:00:00.000Z'),
            endTime: new Date('1970-01-01T10:00:00.000Z'),
          };
    await tx.event.upsert({
      where: { id: fixture.eventId },
      update: {
        title: fixture.title,
        description:
          'Taller ficticio para validar pases vigentes y finalizados en QA.',
        instructorName: 'Equipo QA',
        eventDate: schedule.eventDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
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
        eventDate: schedule.eventDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
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

export async function seedRegistrationCancellationEvents(
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
  for (const fixture of REGISTRATION_CANCELLATION_FIXTURES) {
    const eventDate = getBoliviaCalendarDate(now, fixture.dayOffset);
    const startTime = new Date('1970-01-01T09:00:00.000Z');
    const endTime = new Date('1970-01-01T10:00:00.000Z');
    await tx.event.upsert({
      where: { id: fixture.eventId },
      update: {
        title: fixture.title,
        description:
          'Taller ficticio para validar escenarios de cancelacion y cupos en QA.',
        instructorName: 'Equipo QA',
        eventDate,
        startTime,
        endTime,
        location: 'Aula 101, Facultad de Ciencias y Tecnología',
        capacity: fixture.capacity,
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
          'Taller ficticio para validar escenarios de cancelacion y cupos en QA.',
        instructorName: 'Equipo QA',
        eventDate,
        startTime,
        endTime,
        location: 'Aula 101, Facultad de Ciencias y Tecnología',
        capacity: fixture.capacity,
        supportThreshold: 0,
        categoryId,
        modalityId,
        originId,
        statusId,
        createdById,
      },
    });
  }
  return REGISTRATION_CANCELLATION_FIXTURES.length;
}