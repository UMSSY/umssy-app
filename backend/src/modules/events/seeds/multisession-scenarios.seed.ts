import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import type { Prisma, PrismaClient } from '../../../prisma/client.js';
import { createSeedClient } from '../../../common/database/seed-client.js';
import {
  COMMUNITY_ORIGIN_TITLE,
  EXPIRED_STATUS_TITLE,
  PUBLISHED_STATUS_TITLE,
  VOTING_STATUS_TITLE,
} from '../constants/events.constants.js';
import {
  MULTISESSION_CAPACITY,
  MULTISESSION_SCENARIOS,
  MULTISESSION_SUPPORT_THRESHOLD,
  MULTISESSION_SUPPORTER_EMAILS,
  multisessionId,
} from '../constants/multisession-scenarios.constants.js';
import type { MultisessionScenarioDefinition } from '../constants/multisession-scenarios.constants.js';
import { toBoliviaInstant } from '../utils/event-session-schedule.js';

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function calendarDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function clockTime(time: string): Date {
  return new Date(`1970-01-01T${time}:00.000Z`);
}

export interface MultisessionScenarioUsers {
  organizerId: string;
  participantId: string;
}

async function loadCatalogs(tx: Prisma.TransactionClient) {
  const statusId = async (title: string) =>
    (await tx.eventStatus.findUniqueOrThrow({ where: { title } })).id;
  const originId = async (title: string) =>
    (await tx.eventOrigin.findUniqueOrThrow({ where: { title } })).id;
  const registrationStatusId = async (title: string) =>
    (await tx.registrationStatus.findUniqueOrThrow({ where: { title } })).id;

  const categoryNames = [
    ...new Set(MULTISESSION_SCENARIOS.map((scenario) => scenario.category)),
  ];
  const categories = new Map<string, string>();
  for (const name of categoryNames) {
    const category = await tx.eventCategory.findUniqueOrThrow({
      where: { name },
    });
    categories.set(name, category.id);
  }

  const supporters = new Map<string, string>();
  for (const email of MULTISESSION_SUPPORTER_EMAILS) {
    const user = await tx.user.findUniqueOrThrow({ where: { email } });
    supporters.set(email, user.id);
  }

  return {
    categories,
    supporters,
    modalityId: (
      await tx.eventModality.findUniqueOrThrow({
        where: { title: 'Presencial' },
      })
    ).id,
    origins: {
      community: await originId(COMMUNITY_ORIGIN_TITLE),
      institutional: await originId('Institucional'),
    },
    statuses: {
      proposal: await statusId(VOTING_STATUS_TITLE),
      expired: await statusId(EXPIRED_STATUS_TITLE),
      published: await statusId(PUBLISHED_STATUS_TITLE),
    },
    registrationStatuses: {
      confirmed: await registrationStatusId('Confirmada'),
      cancelled: await registrationStatusId('Cancelada'),
    },
  };
}

type Catalogs = Awaited<ReturnType<typeof loadCatalogs>>;

function buildEventData(
  scenario: MultisessionScenarioDefinition,
  catalogs: Catalogs,
  organizerId: string,
) {
  const first = scenario.sessions[0];
  const isPublished = scenario.kind === 'published';
  return {
    title: scenario.title,
    description: scenario.description,
    instructorName: scenario.instructorName,
    location: scenario.location,
    capacity: MULTISESSION_CAPACITY,
    // La fecha y el horario del taller guardan la primera sesión, como en las propuestas reales.
    eventDate: calendarDate(first.date),
    startTime: clockTime(first.start),
    endTime: clockTime(first.end),
    categoryId: catalogs.categories.get(scenario.category)!,
    modalityId: catalogs.modalityId,
    originId: isPublished
      ? catalogs.origins.institutional
      : catalogs.origins.community,
    statusId:
      scenario.kind === 'published'
        ? catalogs.statuses.published
        : scenario.kind === 'expired'
          ? catalogs.statuses.expired
          : catalogs.statuses.proposal,
    supportThreshold: isPublished ? null : MULTISESSION_SUPPORT_THRESHOLD,
    votingDeadline: scenario.votingDeadline
      ? toBoliviaInstant(
          scenario.votingDeadline.date,
          scenario.votingDeadline.time,
        )
      : null,
    createdById: organizerId,
    createdAt: toBoliviaInstant(
      scenario.createdAt.date,
      scenario.createdAt.time,
    ),
  };
}

async function seedScenarioSessions(
  tx: Prisma.TransactionClient,
  scenario: MultisessionScenarioDefinition,
  eventId: string,
  reset: boolean,
): Promise<string[]> {
  const ids = scenario.sessions.map((_, index) =>
    multisessionId('session', scenario.number, index),
  );
  if (reset)
    await tx.eventSession.deleteMany({
      where: { eventId, id: { notIn: ids } },
    });
  for (const [index, session] of scenario.sessions.entries()) {
    const data = {
      eventId,
      startsAt: toBoliviaInstant(session.date, session.start),
      endsAt: toBoliviaInstant(session.date, session.end),
      location: scenario.location,
    };
    await tx.eventSession.upsert({
      where: { id: ids[index] },
      update: data,
      create: { id: ids[index], ...data },
    });
  }
  return ids;
}

async function seedScenarioRegistrations(
  tx: Prisma.TransactionClient,
  scenario: MultisessionScenarioDefinition,
  eventId: string,
  sessionIds: string[],
  catalogs: Catalogs,
  users: MultisessionScenarioUsers,
  reset: boolean,
): Promise<{ registrations: number; attendances: number }> {
  const ids = scenario.registrations.map((_, index) =>
    multisessionId('registration', scenario.number, index),
  );
  if (reset) {
    await tx.eventRegistration.deleteMany({
      where: { eventId, id: { notIn: ids } },
    });
    await tx.eventAttendance.deleteMany({
      where: { registrationId: { in: ids } },
    });
  }

  const createdAt = toBoliviaInstant(
    scenario.createdAt.date,
    scenario.createdAt.time,
  );
  let attendances = 0;
  for (const [index, registration] of scenario.registrations.entries()) {
    const userId =
      registration.user === 'participant'
        ? users.participantId
        : catalogs.supporters.get(registration.user)!;
    const registeredAt = new Date(createdAt.getTime() + (index + 1) * HOUR_MS);
    const data = {
      eventId,
      userId,
      statusId: registration.cancelled
        ? catalogs.registrationStatuses.cancelled
        : catalogs.registrationStatuses.confirmed,
      registeredAt,
      cancelledAt: registration.cancelled
        ? new Date(registeredAt.getTime() + 24 * HOUR_MS)
        : null,
    };
    await tx.eventRegistration.upsert({
      where: { id: ids[index] },
      update: data,
      create: {
        id: ids[index],
        ...data,
        qrToken: randomBytes(32).toString('hex'),
      },
    });

    for (const attendance of registration.attendances ?? []) {
      const session = scenario.sessions[attendance.session];
      const checkedInAt = new Date(
        toBoliviaInstant(session.date, session.start).getTime() +
          attendance.minutesAfterStart * MINUTE_MS,
      );
      await tx.eventAttendance.create({
        data: {
          registrationId: ids[index],
          sessionId: sessionIds[attendance.session],
          checkedInAt,
          checkedInById: users.organizerId,
          checkedInOffline: false,
          syncedAt: null,
        },
      });
      attendances += 1;
    }
  }
  return { registrations: ids.length, attendances };
}

export async function seedMultisessionScenarios(
  tx: Prisma.TransactionClient,
  users: MultisessionScenarioUsers,
  options: { reset?: boolean } = {},
) {
  const catalogs = await loadCatalogs(tx);
  const summary = { events: 0, sessions: 0, registrations: 0, attendances: 0 };

  for (const scenario of MULTISESSION_SCENARIOS) {
    const eventId = multisessionId('event', scenario.number);
    if (
      !options.reset &&
      (await tx.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      }))
    )
      continue;
    const data = buildEventData(scenario, catalogs, users.organizerId);
    await tx.event.upsert({
      where: { id: eventId },
      update: data,
      create: { id: eventId, ...data },
    });
    const sessionIds = await seedScenarioSessions(
      tx,
      scenario,
      eventId,
      options.reset === true,
    );
    const counts = await seedScenarioRegistrations(
      tx,
      scenario,
      eventId,
      sessionIds,
      catalogs,
      users,
      options.reset === true,
    );
    summary.events += 1;
    summary.sessions += sessionIds.length;
    summary.registrations += counts.registrations;
    summary.attendances += counts.attendances;
  }
  return summary;
}

// Comando para reiniciar solo estos escenarios (por ejemplo, antes de la review).
export async function runMultisessionScenarios(client?: PrismaClient) {
  if (process.env.NODE_ENV === 'production')
    throw new Error(
      'Los escenarios de demostración no se pueden cargar en producción',
    );
  const prisma = client ?? createSeedClient();
  try {
    return await prisma.$transaction(async (tx) => {
      const [organizer, participant] = await Promise.all([
        tx.user.findUniqueOrThrow({
          where: { email: 'carla.montano@umss.edu.bo' },
        }),
        tx.user.findUniqueOrThrow({
          where: { email: 'diego.fernandez@umss.edu.bo' },
        }),
      ]);
      return seedMultisessionScenarios(
        tx,
        {
          organizerId: organizer.id,
          participantId: participant.id,
        },
        { reset: true },
      );
    });
  } finally {
    if (!client) await prisma.$disconnect();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runMultisessionScenarios()
    .then((summary) => {
      console.log('Escenarios multisesión cargados:', summary);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
