import type { Prisma } from '../../../prisma/client.js';

export async function seedCareersCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.career.createMany({
    data: [
      { title: 'Licenciatura en Ingeniería de Sistemas' },
      { title: 'Licenciatura Ingeniería en Informática' },
    ],
    skipDuplicates: true,
  });
}
