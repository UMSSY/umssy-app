import type { Prisma } from '../../../prisma/client.js';

export async function seedMentorOfferStatusesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.mentorOfferStatus.createMany({
    data: [{ title: 'OFFERED' }, { title: 'CONFIRMED' }, { title: 'EXPIRED' }],
    skipDuplicates: true,
  });
}
