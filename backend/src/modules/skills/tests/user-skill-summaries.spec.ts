import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { USER_SKILL_SUMMARY_SELECT } from '../constants/user-skill-summary-select.constants.js';
import { SkillAnalysisRepository } from '../repositories/skill-analysis.repository.js';
import { SkillAnalysisService } from '../services/skill-analysis.service.js';

function createService(records: unknown[] = []) {
  const findMany = vi.fn().mockResolvedValue(records);
  const repository = new SkillAnalysisRepository({
    userSkill: { findMany },
  } as unknown as PrismaService);
  return { findMany, service: new SkillAnalysisService(repository) };
}

describe('SkillAnalysisService.findSkillSummariesByUserIds', () => {
  it('normaliza las habilidades de los usuarios solicitados', async () => {
    const { findMany, service } = createService([
      { userId: 'user-1', source: 'nlp', skill: { id: 'skill-1', name: 'SQL' } },
    ]);

    await expect(service.findSkillSummariesByUserIds(['user-1'])).resolves.toEqual([
      { userId: 'user-1', skillId: 'skill-1', skillName: 'SQL', source: 'nlp' },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: { in: ['user-1'] } },
      select: USER_SKILL_SUMMARY_SELECT,
    });
  });

  it('no consulta cuando no hay usuarios', async () => {
    const { findMany, service } = createService();

    await expect(service.findSkillSummariesByUserIds([])).resolves.toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
