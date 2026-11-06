import type { Prisma } from '../../../prisma/client.js';

export async function seedAccessRequestStatusesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.accessRequestStatus.createMany({
    data: [
      { title: 'draft' },
      { title: 'pending' },
      { title: 'in_review' },
      { title: 'approved' },
      { title: 'rejected' },
    ],
    skipDuplicates: true,
  });
}
