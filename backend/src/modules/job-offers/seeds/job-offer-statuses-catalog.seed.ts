import type { Prisma } from '../../../prisma/client.js';

export async function seedJobOfferStatusesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.jobOfferStatus.createMany({
    data: [
      { title: 'Borrador' },
      { title: 'Publicada' },
      { title: 'Pausada' },
      { title: 'Cerrada' },
      { title: 'Archivada' },
    ],
    skipDuplicates: true,
  });
}
