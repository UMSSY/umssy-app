import { randomBytes } from 'node:crypto';
import { REGISTRATION_STATUS_TITLES } from '../../../common/constants/registration-status.constants.js';
import type { Prisma } from '../../../prisma/client.js';
import { SEED_EVENTS } from '../../events/constants/seed-events.constants.js';
import {
  EVENT_PASS_LIFECYCLE_FIXTURES,
  REGISTRATION_CANCELLATION_FIXTURES,
} from '../../events/seeds/event-pass-lifecycle-fixtures.seed.js';
import { repairSeededQrTokens } from './repair-seeded-qr-tokens.js';

export async function seedEventRegistrations(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  await repairSeededQrTokens(tx);
  const regStatus = await tx.registrationStatus.upsert({
    where: { title: REGISTRATION_STATUS_TITLES.confirmed },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222225',
      title: REGISTRATION_STATUS_TITLES.confirmed,
    },
  });
  const cancelledStatus = await tx.registrationStatus.upsert({
    where: { title: REGISTRATION_STATUS_TITLES.cancelled },
    update: {},
    create: { title: REGISTRATION_STATUS_TITLES.cancelled },
  });
  for (const e of SEED_EVENTS) {
    if (e.enroll) {
      await tx.eventRegistration.upsert({
        where: { eventId_userId: { eventId: e.id, userId: userId } },
        update: {},
        create: {
          eventId: e.id,
          userId: userId,
          statusId: regStatus.id,
          qrToken: randomBytes(32).toString('hex'),
        },
      });
    }
  }
  for (const fixture of EVENT_PASS_LIFECYCLE_FIXTURES) {
    await tx.eventRegistration.upsert({
      where: { id: fixture.registrationId },
      update: {
        eventId: fixture.eventId,
        userId,
        statusId: regStatus.id,
        cancelledAt: null,
      },
      create: {
        id: fixture.registrationId,
        eventId: fixture.eventId,
        userId,
        statusId: regStatus.id,
        qrToken: randomBytes(32).toString('hex'),
      },
    });
  }
  for (const fixture of REGISTRATION_CANCELLATION_FIXTURES) {
    const isCancelled = fixture.initialStatus === 'cancelled';
    const statusId = isCancelled ? cancelledStatus.id : regStatus.id;
    const cancelledAt = isCancelled ? new Date() : null;
    await tx.eventRegistration.upsert({
      where: { id: fixture.registrationId },
      update: {
        eventId: fixture.eventId,
        userId,
        statusId,
        cancelledAt,
      },
      create: {
        id: fixture.registrationId,
        eventId: fixture.eventId,
        userId,
        statusId,
        cancelledAt,
        qrToken: randomBytes(32).toString('hex'),
      },
    });
  }
}