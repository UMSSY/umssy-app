import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

export async function seedSkillsFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.SkillCreateManyInput[] = [
    {
      id: context.getId('record-03495'),
      name: 'Seed: Accesibilidad',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      isCustom: true,
    },
    {
      id: context.getId('record-03290'),
      name: 'Seed: Observabilidad',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      isCustom: true,
    },
    {
      id: context.getId('record-02787'),
      name: 'Seed: Liderazgo técnico',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      isCustom: true,
    },
    {
      id: context.getId('record-00901'),
      name: 'Seed: Modelado de dominios',
      createdAt: context.getDate('anchor', 0, false),
      updatedAt: context.getDate('anchor', 0, false),
      isCustom: true,
    },
  ];
  await tx.skill.createMany({ data, skipDuplicates: true });
  for (const record of await tx.skill.findMany())
    context.setReference('skills', record.name, record.id);
  return data.length;
}
