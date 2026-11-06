import type { Prisma } from '../../../prisma/client.js';

export async function seedEventStatusesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.eventStatus.createMany({
    data: [
      { title: 'Publicado' },
      { title: 'Borrador' },
      { title: 'Cancelado' },
      { title: 'Finalizado' },
    ],
    skipDuplicates: true,
  });
}
