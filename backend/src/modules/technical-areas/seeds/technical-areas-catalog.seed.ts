import type { Prisma } from '../../../prisma/client.js';

export async function seedTechnicalAreasCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.technicalArea.createMany({
    data: [
      { name: 'Backend' },
      { name: 'Desarrollo Web' },
      { name: 'Bases de Datos' },
      { name: 'QA' },
      { name: 'Datos' },
      { name: 'Cloud' },
      { name: 'Redes' },
      { name: 'Arquitectura' },
    ],
    skipDuplicates: true,
  });
}
