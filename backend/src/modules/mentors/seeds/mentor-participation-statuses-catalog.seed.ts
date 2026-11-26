import type { Prisma } from '../../../prisma/client.js';

export async function seedMentorParticipationStatusesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.mentorParticipationStatus.createMany({
    data: [
      { title: 'PENDING' },
      { title: 'OFFERED' },
      { title: 'ACTIVE' },
      { title: 'CANCELLED' },
      { title: 'EXPIRED' },
      { title: 'ENDED' },
    ],
    skipDuplicates: true,
  });
}
