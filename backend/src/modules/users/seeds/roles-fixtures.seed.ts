import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

export async function seedRolesFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.RoleCreateManyInput[] = [
    {
      id: context.getId('record-03304'),
      name: 'estudiante',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
    },
    {
      id: context.getId('record-02806'),
      name: 'mentor',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
    },
    {
      id: context.getId('record-00158'),
      name: 'titulado',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
    },
    {
      id: context.getId('record-02369'),
      name: 'empresa',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
    },
  ];
  await tx.role.createMany({ data, skipDuplicates: true });
  for (const record of await tx.role.findMany())
    context.setReference('roles', record.name, record.id);
  return data.length;
}
