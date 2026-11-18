import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { WORK_PERIOD_SELECT } from '../constants/work-period-select.constants.js';
import { WorkExperienceRepository } from '../repositories/work-experience.repository.js';
import { WorkExperienceSourcesService } from '../services/work-experience-sources.service.js';

describe('WorkExperienceSourcesService', () => {
  it.each([null, { id: 'experience-1' }])(
    'checks record presence without loading experience content: %j',
    async (record) => {
      const findFirst = vi.fn().mockResolvedValue(record);
      const repository = new WorkExperienceRepository({
        workExperience: { findFirst },
      } as unknown as PrismaService);
      const service = new WorkExperienceSourcesService(repository);

      await expect(service.hasByUserId('owner-1')).resolves.toBe(
        record !== null,
      );
      expect(findFirst).toHaveBeenCalledExactlyOnceWith({
        where: { userId: 'owner-1' },
        select: { id: true },
      });
    },
  );

  it('reads only the analysis fields of the requested owner', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const records = [
      { id: 'source-1', position: 'Desarrollo', description: null },
    ];
    const findMany = vi.fn().mockResolvedValue(records);
    const repository = new WorkExperienceRepository({
      workExperience: { findMany },
    } as unknown as PrismaService);
    const service = new WorkExperienceSourcesService(repository);

    await expect(service.findAnalysisSources(userId)).resolves.toBe(records);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
      select: { id: true, position: true, description: true },
    });
  });
});

describe('WorkExperienceSourcesService.findPeriodsByUserIds', () => {
  it('reads only the work periods of the requested users', async () => {
    const records = [
      { userId: 'owner-1', startDate: new Date('2024-01-01'), endDate: null },
    ];
    const findMany = vi.fn().mockResolvedValue(records);
    const repository = new WorkExperienceRepository({
      workExperience: { findMany },
    } as unknown as PrismaService);
    const service = new WorkExperienceSourcesService(repository);

    await expect(service.findPeriodsByUserIds(['owner-1'])).resolves.toBe(
      records,
    );
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: { in: ['owner-1'] } },
      select: WORK_PERIOD_SELECT,
    });
  });

  it('skips the query when there are no users', async () => {
    const findMany = vi.fn();
    const repository = new WorkExperienceRepository({
      workExperience: { findMany },
    } as unknown as PrismaService);
    const service = new WorkExperienceSourcesService(repository);

    await expect(service.findPeriodsByUserIds([])).resolves.toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
