import type { Prisma } from '../../../prisma/client.js';

export async function seedProposalStatusesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.proposalStatus.createMany({
    data: [
      { title: 'PENDIENTE' },
      { title: 'ACEPTADA' },
      { title: 'RECHAZADA' },
    ],
    skipDuplicates: true,
  });
}
