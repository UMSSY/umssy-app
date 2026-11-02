import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

export async function seedCompaniesFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.CompanyCreateManyInput[] = [
    {
      id: context.getId('record-00787'),
      title: 'Seed: Nube Andina',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      description: 'Catálogo de demostración UMSSY: Seed: Nube Andina',
    },
    {
      id: context.getId('record-01478'),
      title: 'Seed: Código Horizonte',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      description: 'Catálogo de demostración UMSSY: Seed: Código Horizonte',
    },
    {
      id: context.getId('record-02585'),
      title: 'Seed: Prisma Laboratorio',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      description: 'Catálogo de demostración UMSSY: Seed: Prisma Laboratorio',
    },
    {
      id: context.getId('record-03270'),
      title: 'Seed: Circuito Azul',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      description: 'Catálogo de demostración UMSSY: Seed: Circuito Azul',
    },
    {
      id: context.getId('record-00774'),
      title: 'Seed: Bit Valle',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      description: 'Catálogo de demostración UMSSY: Seed: Bit Valle',
    },
    {
      id: context.getId('record-00138'),
      title: 'Seed: Vector Sur',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      description: 'Catálogo de demostración UMSSY: Seed: Vector Sur',
    },
    {
      id: context.getId('record-02900'),
      title: 'Seed: Nodo Abierto',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      description: 'Catálogo de demostración UMSSY: Seed: Nodo Abierto',
    },
    {
      id: context.getId('record-00571'),
      title: 'Seed: Datos Aurora',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      description: 'Catálogo de demostración UMSSY: Seed: Datos Aurora',
    },
  ];
  await tx.company.createMany({ data, skipDuplicates: true });
  for (const record of await tx.company.findMany())
    context.setReference('companies', record.title, record.id);
  return data.length;
}
