import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RadarRecruitmentRepository } from '../repositories/radar-recruitment.repository.js';

describe('RadarRecruitmentRepository', () => {
  it('only reads Radar tables and obtains an approved CV identifier', async () => {
    const prisma = {
      $executeRaw: vi.fn(),
      $queryRaw: vi.fn().mockResolvedValue([]),
    };
    const repository = new RadarRecruitmentRepository(
      prisma as unknown as PrismaService,
    );
    await repository.grantCompany('user', 'company');
    await repository.allowedCompany('user', 'company');
    await repository.linkedCompanies('user');
    await repository.latestSnapshot('user');
    await repository.approvedCvId('user');
    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(4);
    const queries = prisma.$queryRaw.mock.calls
      .map(([sql]) => sql.join(' '))
      .join(' ');
    expect(queries).not.toContain('user_cv_file');
    expect(queries).toContain('e.cv_id');
  });
});
