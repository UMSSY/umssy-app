import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

export async function seedCitiesFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.CityCreateManyInput[] = [
    {
      id: context.getId('record-01865'),
      title: 'Seed: Valle Claro',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      description: 'Catálogo de demostración UMSSY: Seed: Valle Claro',
    },
    {
      id: context.getId('record-00900'),
      title: 'Seed: Puerto Nube',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      description: 'Catálogo de demostración UMSSY: Seed: Puerto Nube',
    },
    {
      id: context.getId('record-01861'),
      title: 'Seed: Villa Algoritmo',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      description: 'Catálogo de demostración UMSSY: Seed: Villa Algoritmo',
    },
    {
      id: context.getId('record-02889'),
      title: 'Seed: Ciudad Binaria',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      description: 'Catálogo de demostración UMSSY: Seed: Ciudad Binaria',
    },
    {
      id: context.getId('record-01374'),
      title: 'Seed: Sierra Digital',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      description: 'Catálogo de demostración UMSSY: Seed: Sierra Digital',
    },
  ];
  await tx.city.createMany({ data, skipDuplicates: true });
  for (const record of await tx.city.findMany())
    context.setReference('cities', record.title, record.id);
  return data.length;
}
