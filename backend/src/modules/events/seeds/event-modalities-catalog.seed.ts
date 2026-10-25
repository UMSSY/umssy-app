import type { Prisma } from '../../../prisma/client.js';

export async function seedEventModalitiesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.eventModality.createMany({
    data: [{ title: 'Presencial' }, { title: 'Virtual' }, { title: 'Híbrido' }],
    skipDuplicates: true,
  });
}
