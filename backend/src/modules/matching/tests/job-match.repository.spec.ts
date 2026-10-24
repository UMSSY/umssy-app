import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JOB_MATCH_SELECT } from '../constants/job-match.constants.js';
import { JobMatchRepository } from '../repositories/job-match.repository.js';

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

describe('JobMatchRepository', () => {
  let prisma: {
    jobOffer: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    education: { findFirst: ReturnType<typeof vi.fn> };
    workExperience: { findMany: ReturnType<typeof vi.fn> };
  };
  let repository: JobMatchRepository;

  beforeEach(() => {
    prisma = {
      jobOffer: { findFirst: vi.fn(), findMany: vi.fn() },
      education: { findFirst: vi.fn() },
      workExperience: { findMany: vi.fn() },
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

  it('arma el perfil con la formación más reciente y los años de experiencia', async () => {
    prisma.education.findFirst.mockResolvedValue({
      degree: 'Ingeniería de Sistemas',
    });
    prisma.workExperience.findMany.mockResolvedValue([
      { startDate: date('2020-01-01'), endDate: date('2022-01-01'), isCurrent: false },
    ]);

    await expect(repository.findCandidateProfile('user-1')).resolves.toEqual({
      career: 'Ingeniería de Sistemas',
      experienceYears: 2,
    });
    expect(prisma.education.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { startDate: 'desc' },
      select: { degree: true },
    });
    expect(prisma.workExperience.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { startDate: true, endDate: true, isCurrent: true },
    });
  });

  it('devuelve carrera nula y 0 años cuando el perfil no tiene formación ni experiencia', async () => {
    prisma.education.findFirst.mockResolvedValue(null);
    prisma.workExperience.findMany.mockResolvedValue([]);

    await expect(repository.findCandidateProfile('user-1')).resolves.toEqual({
      career: null,
      experienceYears: 0,
    });
  });
});
