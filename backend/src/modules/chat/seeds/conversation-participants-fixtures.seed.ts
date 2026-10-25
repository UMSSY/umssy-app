import { FIXTURE_CONVERSATIONS } from '../constants/seed-fixture-chat.constants.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

export async function seedConversationParticipantsFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.ConversationParticipantCreateManyInput[] =
    FIXTURE_CONVERSATIONS.flatMap((plan, index) =>
      plan.userKeys.map((userKey, participantIndex) => ({
        id: context.getId(plan.participantKeys[participantIndex]),
        conversationId: context.getId(plan.key),
        userId: context.getId(userKey),
        lastReadAt: context.getDate('anchor', -87, false),
        isMuted: plan.muted[participantIndex],
        createdAt: context.getDate('anchor', -2881 - index, false),
        updatedAt: context.anchor,
      })),
    );
  await tx.conversationParticipant.createMany({ data, skipDuplicates: true });
  return data.length;
}
