import type { Prisma } from '../../../prisma/client.js';

export async function seedCitiesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  const titles = [
    'Cochabamba',
    'La Paz',
    'Santa Cruz de la Sierra',
    'Sucre',
    'Oruro',
    'Potosí',
    'Tarija',
    'Trinidad',
    'Cobija',
    'El Alto',
    'Sacaba',
    'Quillacollo',
  ];
  await tx.city.createMany({
    data: titles.map((title) => ({ title })),
    skipDuplicates: true,
  });
}
