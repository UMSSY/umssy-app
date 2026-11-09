import { REGISTRATION_STATUS_TITLES } from '../../../common/constants/registration-status.constants.js';
import { repairSeededQrTokens } from './repair-seeded-qr-tokens.js';
import { randomBytes } from 'node:crypto';
import type { Prisma } from '../../../prisma/client.js';
import { SEED_EVENTS } from '../../events/constants/seed-events.constants.js';

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
  await tx.registrationStatus.upsert({
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
}
