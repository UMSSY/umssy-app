import type { Prisma } from '../../../prisma/client.js';

export async function seedConnectionRequestStatusesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.connectionRequestStatus.createMany({
    data: [
      { title: 'PENDING', description: 'Pendiente' },
      { title: 'ACCEPTED', description: 'Aceptada' },
      { title: 'REJECTED', description: 'Rechazada' },
    ],
    skipDuplicates: true,
  });
}