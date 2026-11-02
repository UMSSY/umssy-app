import type { Prisma } from '../../../prisma/client.js';

export async function seedRegistrationStatusesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.registrationStatus.createMany({
    data: [{ title: 'Confirmada' }, { title: 'Cancelada' }],
    skipDuplicates: true,
  });
}
