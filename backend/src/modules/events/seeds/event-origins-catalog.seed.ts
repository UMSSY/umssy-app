import type { Prisma } from '../../../prisma/client.js';

export async function seedEventOriginsCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.eventOrigin.createMany({
    data: [{ title: 'Institucional' }, { title: 'Comunidad' }],
    skipDuplicates: true,
  });
}
