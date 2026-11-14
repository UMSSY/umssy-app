import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RadarApplicationsRepository } from '../repositories/radar-applications.repository.js';

const APPLICATION_ID = '22222222-2222-4222-8222-222222222222';

function setup() {
  const prisma = {
    radarApplicationConsent: { findMany: vi.fn().mockResolvedValue([]) },
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

  it('persiste cada consentimiento sin derivarlo del radar', async () => {
    const { prisma, repository } = setup();
    prisma.$queryRaw.mockResolvedValueOnce([{ id: APPLICATION_ID }]);

    await expect(
      repository.setConsents(APPLICATION_ID, true, true, false),
    ).resolves.toEqual([{ id: APPLICATION_ID }]);
    await repository.setConsents(APPLICATION_ID, false, true, true);

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    expect(prisma.$queryRaw.mock.calls[1].slice(1)).toEqual([APPLICATION_ID, false, true, true]);
  });

  it('reads and revokes consent without accessing application tables', async () => {
    const { prisma, repository } = setup();
    prisma.radarApplicationConsent.findMany.mockResolvedValueOnce([
      {
        applicationId: APPLICATION_ID,
        consentToRecruiter: true,
        consentToCv: false,
        consentToContact: true,
      },
    ]);
    await expect(repository.findConsents([APPLICATION_ID])).resolves.toEqual([
      {
        application_id: APPLICATION_ID,
        consent_to_recruiter: true,
        consent_to_cv: false,
        consent_to_contact: true,
      },
    ]);
    await repository.revokeConsents(APPLICATION_ID);
    expect(prisma.radarApplicationConsent.findMany).toHaveBeenCalledWith({
      where: { applicationId: { in: [APPLICATION_ID] } },
      select: {
        applicationId: true,
        consentToRecruiter: true,
        consentToCv: true,
        consentToContact: true,
      },
    });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
  });
});
