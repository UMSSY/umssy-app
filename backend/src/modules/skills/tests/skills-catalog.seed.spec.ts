import { describe, expect, it, vi } from 'vitest';
import { SEED_SKILLS_CATALOG, seedSkillsCatalog } from '../seeds/skills-catalog.seed.js';

describe('seedSkillsCatalog', () => {
  it('seeds skills with their radar areas and backfills missing areaIds', async () => {
    const tx = {
      skill: {
        createMany: vi.fn().mockResolvedValue({ count: SEED_SKILLS_CATALOG.length }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    await seedSkillsCatalog(tx as never);

    expect(tx.skill.createMany).toHaveBeenCalledWith({
      data: SEED_SKILLS_CATALOG.map((skill) => ({
        name: skill.name,
        isCustom: false,
        areaId: skill.areaId,
      })),
      skipDuplicates: true,
    });

    expect(tx.skill.updateMany).toHaveBeenCalledTimes(6);
  });
});
