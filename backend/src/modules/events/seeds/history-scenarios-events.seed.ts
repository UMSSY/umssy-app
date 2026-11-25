import type { Prisma } from '../../../prisma/client.js';
import {
  buildHistoryEventScenarios,
  HISTORY_EVENT_IDS,
} from '../constants/history-scenarios.constants.js';

export async function seedHistoryScenarioEvents(
  tx: Prisma.TransactionClient,
  createdById: string,
  now: Date,
): Promise<void> {
  const [category, modality, origin, status] = await Promise.all([
    tx.eventCategory.findUniqueOrThrow({ where: { name: 'Tecnología' } }),
    tx.eventModality.findUniqueOrThrow({ where: { title: 'Presencial' } }),
    tx.eventOrigin.findUniqueOrThrow({ where: { title: 'Institucional' } }),
    tx.eventStatus.findUniqueOrThrow({ where: { title: 'Publicado' } }),
  ]);
  const scenarios = buildHistoryEventScenarios(now);
  const shared = {
    description: 'Taller ficticio para comprobar el historial de inscripciones.',
    categoryId: category.id,
    instructorName: 'Facilitador de pruebas',
    modalityId: modality.id,
    originId: origin.id,
    statusId: status.id,
    capacity: 30,
    supportThreshold: 0,
    createdById,
  };
  const historical: Prisma.EventCreateManyInput[] = [
    ...scenarios.historical,
    scenarios.cancelledRegistration,
    scenarios.fixedBoundary,
  ].map(({ id, title, eventDate, startTime, endTime, location }) => ({
    ...shared,
    id,
    title,
    eventDate,
    startTime,
    endTime,
    location,
  }));
  await tx.event.createMany({ data: historical, skipDuplicates: true });

  for (const event of [scenarios.boundary, scenarios.future]) {
    const { id, title, eventDate, startTime, endTime, location } = event;
    await tx.event.upsert({
      where: { id },
      update: { eventDate, startTime, endTime },
      create: {
        ...shared,
        id,
        title,
        eventDate,
        startTime,
        endTime,
        location,
      },
    });
  }
  await tx.eventSession.upsert({
    where: { id: HISTORY_EVENT_IDS.boundarySession },
    update: {
      startsAt: scenarios.boundary.startsAt,
      endsAt: scenarios.boundary.endsAt,
    },
    create: {
      id: HISTORY_EVENT_IDS.boundarySession,
      eventId: HISTORY_EVENT_IDS.boundary,
      startsAt: scenarios.boundary.startsAt,
      endsAt: scenarios.boundary.endsAt,
      location: scenarios.boundary.location,
    },
  });
  await tx.eventSession.upsert({
    where: { id: HISTORY_EVENT_IDS.fixedBoundarySession },
    update: {},
    create: {
      id: HISTORY_EVENT_IDS.fixedBoundarySession,
      eventId: HISTORY_EVENT_IDS.fixedBoundary,
      startsAt: scenarios.fixedBoundary.startsAt,
      endsAt: scenarios.fixedBoundary.endsAt,
      location: scenarios.fixedBoundary.location,
    },
  });
}
