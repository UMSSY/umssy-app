import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { WorkExperienceRepository } from '../repositories/work-experience.repository.js';
import { WorkExperienceSourcesService } from '../services/work-experience-sources.service.js';

describe('WorkExperienceSourcesService', () => {
  it('reads only the analysis fields of the requested owner', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const records = [{ id: 'source-1', position: 'Desarrollo', description: null }];
    const findMany = vi.fn().mockResolvedValue(records);
    const repository = new WorkExperienceRepository({ workExperience: { findMany } } as unknown as PrismaService);
    const service = new WorkExperienceSourcesService(repository);

    await expect(service.findAnalysisSources(userId)).resolves.toBe(records);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
      select: { id: true, position: true, description: true },
    });
  });
});
