import type { Prisma } from '../../../prisma/client.js';

export async function seedJobOfferContractTypesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.jobOfferContractType.createMany({
    data: [
      { title: 'Tiempo completo' },
      { title: 'Medio tiempo' },
      { title: 'Pasantía' },
    ],
    skipDuplicates: true,
  });
}
