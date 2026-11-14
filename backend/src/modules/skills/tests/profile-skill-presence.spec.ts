import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { SkillAnalysisRepository } from '../repositories/skill-analysis.repository.js';
import { SkillAnalysisService } from '../services/skill-analysis.service.js';

describe('Profile skill presence', () => {
  it.each([null, { id: 'skill-row-1' }])(
    'checks saved skills without loading their evidence: %j',
    async (record) => {
      const findFirst = vi.fn().mockResolvedValue(record);
      const repository = new SkillAnalysisRepository({
        userSkill: { findFirst },
      } as unknown as PrismaService);
      const service = new SkillAnalysisService(repository);

      await expect(service.hasProfileSkills('owner-1')).resolves.toBe(
        record !== null,
      );
      expect(findFirst).toHaveBeenCalledExactlyOnceWith({
        where: { userId: 'owner-1' },
        select: { id: true },
      });
    },
  );
});
