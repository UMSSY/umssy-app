import type { Prisma } from '../../../prisma/client.js';

export async function seedMessageStatusesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.messageStatus.createMany({
    data: [
      { title: 'SENDING' },
      { title: 'SENT' },
      { title: 'DELIVERED' },
      { title: 'READ' },
    ],
    skipDuplicates: true,
  });
}
