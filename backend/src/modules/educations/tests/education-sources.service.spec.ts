import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { EducationsRepository } from '../repositories/educations.repository.js';
import { EducationSourcesService } from '../services/education-sources.service.js';

describe('EducationSourcesService', () => {
  it('reads only the analysis fields of the requested owner', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const records = [{ id: 'source-1', degree: 'Desarrollo', description: null }];
    const findMany = vi.fn().mockResolvedValue(records);
    const repository = new EducationsRepository({ education: { findMany } } as unknown as PrismaService);
    const service = new EducationSourcesService(repository);

    await expect(service.findAnalysisSources(userId)).resolves.toBe(records);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
      select: { id: true, degree: true, description: true },
    });
  });
});
