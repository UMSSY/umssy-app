import { randomBytes } from 'node:crypto';
import { DAY_MS, HOUR_MS } from '../../../common/constants/date-time.constants.js';
import type { Prisma } from '../../../prisma/client.js';
import {
  buildHistoryEventScenarios,
  HISTORY_EVENT_IDS,
} from '../../events/constants/history-scenarios.constants.js';

const futureRegistrationId = 'a1b2c3d4-e5f6-4a78-9b0c-d1e2f3a4b5c6';

function registrationId(index: number): string {
  return `77777777-7777-7777-7777-${String(index + 1).padStart(12, '0')}`;
}

export async function seedHistoryScenarioRegistrations(
  tx: Prisma.TransactionClient,
  primaryUserId: string,
  secondaryUserId: string,
  now: Date,
): Promise<void> {
  const [confirmed, cancelled] = await Promise.all([
    tx.registrationStatus.findUniqueOrThrow({ where: { title: 'Confirmada' } }),
    tx.registrationStatus.findUniqueOrThrow({ where: { title: 'Cancelada' } }),
  ]);
  const scenarios = buildHistoryEventScenarios(now);
  const primaryHistorical = scenarios.historical.slice(0, 12).map((event, index) => ({
    id: registrationId(index),
    eventId: event.id,
    userId: primaryUserId,
    statusId: confirmed.id,
    registeredAt: new Date(event.eventDate.getTime() - 2 * DAY_MS),
    cancelledAt: null,
    qrToken: randomBytes(32).toString('hex'),
  }));
  const registrationData: Prisma.EventRegistrationCreateManyInput[] = [
    ...primaryHistorical,
    {
      id: registrationId(12),
      eventId: HISTORY_EVENT_IDS.cancelledRegistration,
      userId: primaryUserId,
      statusId: cancelled.id,
      registeredAt: new Date(
        scenarios.cancelledRegistration.eventDate.getTime() - 2 * DAY_MS,
      ),
      cancelledAt: new Date(
        scenarios.cancelledRegistration.eventDate.getTime() + 20 * HOUR_MS,
      ),
      qrToken: randomBytes(32).toString('hex'),
    },
    ...[scenarios.boundary, scenarios.future].map((event, index) => ({
      id:
        event.id === HISTORY_EVENT_IDS.future
          ? futureRegistrationId
          : registrationId(index + 13),
      eventId: event.id,
      userId: primaryUserId,
      statusId: confirmed.id,
      registeredAt: now,
      cancelledAt: null,
      qrToken: randomBytes(32).toString('hex'),
    })),
    ...[scenarios.historical[0], scenarios.historical[12]].map(
      (event, index) => ({
        id: registrationId(index + 15),
        eventId: event.id,
        userId: secondaryUserId,
        statusId: confirmed.id,
        registeredAt: new Date(event.eventDate.getTime() - 2 * DAY_MS),
        cancelledAt: null,
        qrToken: randomBytes(32).toString('hex'),
      }),
    ),
    {
      id: registrationId(17),
      eventId: HISTORY_EVENT_IDS.fixedBoundary,
      userId: primaryUserId,
      statusId: confirmed.id,
      registeredAt: new Date('2026-11-20T12:00:00.000Z'),
      cancelledAt: null,
      qrToken: randomBytes(32).toString('hex'),
    },
  ];
  await tx.eventRegistration.createMany({
    data: registrationData,
    skipDuplicates: true,
  });
  await tx.eventRegistration.updateMany({
    where: {
      eventId: HISTORY_EVENT_IDS.future,
      userId: primaryUserId,
    },
    data: { id: futureRegistrationId },
  });
  await tx.eventAttendance.createMany({
    data: [
      {
        id: '88888888-8888-8888-8888-000000000001',
        registrationId: registrationId(4),
        checkedInAt: new Date(
          scenarios.historical[4].eventDate.getTime() + 13 * HOUR_MS,
        ),
        checkedInById: null,
        checkedInOffline: false,
      },
    ],
    skipDuplicates: true,
  });
}
