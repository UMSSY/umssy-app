import type { Prisma } from '../../../prisma/client.js';

export async function seedJobOfferModalitiesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.jobOfferModality.createMany({
    data: [{ title: 'Presencial' }, { title: 'Remoto' }, { title: 'Híbrido' }],
    skipDuplicates: true,
  });
}
