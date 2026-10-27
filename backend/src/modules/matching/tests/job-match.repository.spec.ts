import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JOB_MATCH_SELECT } from '../constants/job-match.constants.js';
import { JobMatchRepository } from '../repositories/job-match.repository.js';

describe('JobMatchRepository', () => {
  let prisma: {
    jobOffer: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };
  let repository: JobMatchRepository;

  beforeEach(() => {
    prisma = {
      jobOffer: { findFirst: vi.fn(), findMany: vi.fn() },
    };
    repository = new JobMatchRepository(prisma as unknown as PrismaService);
  });

  it('busca una vacante publicada y vigente por id', async () => {
    const now = new Date('2026-11-02T15:00:00.000Z');
    const record = { id: 'offer-1' };
    prisma.jobOffer.findFirst.mockResolvedValue(record);

    await expect(repository.findPublishedById('offer-1', now)).resolves.toBe(
      record,
    );
    expect(prisma.jobOffer.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'offer-1',
        status: { title: 'Publicada' },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: JOB_MATCH_SELECT,
    });
  });

  it('devuelve null si la vacante no existe, no está publicada o venció', async () => {
    prisma.jobOffer.findFirst.mockResolvedValue(null);

    await expect(
      repository.findPublishedById('missing', new Date()),
    ).resolves.toBeNull();
  });

  it('lista las vacantes publicadas y vigentes de la más nueva a la más antigua', async () => {
    const now = new Date('2026-11-02T15:00:00.000Z');
    const records = [{ id: 'offer-1' }, { id: 'offer-2' }];
    prisma.jobOffer.findMany.mockResolvedValue(records);

    await expect(repository.findPublished(now)).resolves.toBe(records);
    expect(prisma.jobOffer.findMany).toHaveBeenCalledWith({
      where: {
        status: { title: 'Publicada' },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
      select: JOB_MATCH_SELECT,
    });
  });

  it('pide los requisitos de la vacante: carreras, años mínimos y otros', () => {
    expect(JOB_MATCH_SELECT).toMatchObject({
      requiredCareers: true,
      minExperienceYears: true,
      otherRequirements: true,
    });
  });
});
