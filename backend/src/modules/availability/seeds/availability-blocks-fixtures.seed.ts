import { FIXTURE_MENTORS } from '../../users/constants/seed-fixture-users.constants.js';
import { FIXTURE_AVAILABILITY } from '../constants/seed-fixture-availability.constants.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

export async function seedAvailabilityBlocksFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data = buildAvailabilityBlockFixtures(context);
  await tx.availabilityBlock.createMany({ data, skipDuplicates: true });
  return data.length;
}

export function buildAvailabilityBlockFixtures(context: FixtureContext) {
  return FIXTURE_MENTORS.flatMap((mentor, mentorIndex) => {
    const plan = FIXTURE_AVAILABILITY[mentorIndex];
    const offset = (mentorIndex % 8) * 30;
    return plan.blockKeys.map((key, slotIndex) => {
      const isRecurring = slotIndex < 24;
      const day = isRecurring ? slotIndex % 6 : slotIndex - 24;
      const week = isRecurring ? Math.floor(slotIndex / 6) + 1 : -4;
      const minutes = week * 7 * 1440 + day * 1440 + 540 + offset;
      return {
        id: context.getId(key),
        mentorId: context.getId(mentor.key),
        startAt: context.getDate('monday', minutes, false),
        endAt: context.getDate('monday', minutes + 30, false),
        seriesId: isRecurring ? context.getId(plan.seriesKeys[day]) : null,
        repeatUntil: isRecurring
          ? context.getDate('monday', 47520, true)
          : null,
        createdAt: context.anchor,
        updatedAt: context.anchor,
      };
    });
  });
}
