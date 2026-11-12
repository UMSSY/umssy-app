import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RadarApplicationsRepository } from '../repositories/radar-applications.repository.js';

const APPLICATION_ID = '22222222-2222-4222-8222-222222222222';

function setup() {
  const prisma = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    $executeRaw: vi.fn().mockResolvedValue(1),
  };
  const repository = new RadarApplicationsRepository(
    prisma as unknown as PrismaService,
  );
  return { prisma, repository };
}

describe('RadarApplicationsRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persiste consentimientos independientes y deriva CV/contacto del radar', async () => {
    const { prisma, repository } = setup();
    prisma.$queryRaw.mockResolvedValueOnce([{ id: APPLICATION_ID }]);

    await expect(
      repository.setConsents(APPLICATION_ID, true, true, false),
    ).resolves.toEqual([{ id: APPLICATION_ID }]);
    await repository.setConsents(APPLICATION_ID, false, true, true);

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('reads and revokes consent without accessing application tables', async () => {
    const { prisma, repository } = setup();
    await repository.findConsents([APPLICATION_ID]);
    await repository.revokeConsents(APPLICATION_ID);
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
    const [sql, ids] = prisma.$queryRaw.mock.calls[0];
    expect(sql.join(' ')).toContain('radar_application_consents');
    expect(sql.join(' ')).not.toContain('job_applications');
    expect(ids).toEqual([APPLICATION_ID]);
  });
});
