import { FIXTURE_CONVERSATIONS } from '../constants/seed-fixture-chat.constants.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

export async function seedConversationsFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.ConversationCreateManyInput[] = FIXTURE_CONVERSATIONS.map(
    (plan, index) => ({
      id: context.getId(plan.key),
      userAId: context.getId(plan.userKeys[0]),
      userBId: context.getId(plan.userKeys[1]),
      lastMessageId: null,
      lastMessageAt: null,
      createdAt: context.getDate('anchor', -2881 - index, false),
      updatedAt: context.anchor,
    }),
  );
  for (const row of data)
    [row.userAId, row.userBId] = [row.userAId, row.userBId].sort();
  await tx.conversation.createMany({ data, skipDuplicates: true });
  return data.length;
}
