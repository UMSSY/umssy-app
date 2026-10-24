import type { Prisma } from '../../../prisma/client.js';

export async function seedOrientationTypesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.orientationType.createMany({
    data: [
      { name: 'Orientación profesional', isActive: true },
      { name: 'Orientación técnica', isActive: true },
      { name: 'Revisión de CV', isActive: true },
      { name: 'Búsqueda de empleo', isActive: true },
      { name: 'Preparación para entrevistas', isActive: true },
    ],
    skipDuplicates: true,
  });
}
