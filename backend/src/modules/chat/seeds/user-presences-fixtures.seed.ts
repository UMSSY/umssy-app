import { FIXTURE_USERS } from '../../users/constants/seed-fixture-users.constants.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

export async function seedUserPresencesFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.UserPresenceCreateManyInput[] = FIXTURE_USERS.map(
    (user) => ({
      userId: context.getId(user.key),
      isOnline: false,
      lastSeenAt: context.getDate('anchor', -37 * user.number, false),
      updatedAt: context.anchor,
    }),
  );
  await tx.userPresence.createMany({ data, skipDuplicates: true });
  return data.length;
}
