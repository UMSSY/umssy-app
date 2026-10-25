import type { Prisma } from '../../../prisma/client.js';

export async function seedEventCategoriesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.eventCategory.createMany({
    data: [
      { name: 'Tecnología' },
      { name: 'Empleabilidad' },
      { name: 'Emprendimiento' },
      { name: 'Investigación' },
    ],
    skipDuplicates: true,
  });
}
