import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JobApplicationsRepository } from '../repositories/job-applications.repository.js';

const SELECT = {
  id: true,
  appliedAt: true,
  status: { select: { title: true } },
  jobOffer: {
    select: { id: true, title: true, company: { select: { title: true } } },
  },
};

describe('HU-02B T2.8 - JobApplicationsRepository', () => {
  const prisma = {
    jobOffer: { findFirst: vi.fn() },
    jobApplicationStatus: { findUnique: vi.fn() },
    jobApplication: { findUnique: vi.fn(), create: vi.fn() },
  };
  let repository: JobApplicationsRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    repository = new JobApplicationsRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('considera abierta solo una vacante publicada y vigente', async () => {
    const now = new Date('2026-10-21T12:00:00.000Z');
    prisma.jobOffer.findFirst.mockResolvedValue({ id: 'offer-1' });

    await expect(repository.isOfferOpen('offer-1', now)).resolves.toBe(true);
    expect(prisma.jobOffer.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'offer-1',
        status: { title: 'Publicada' },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    });
  });

  it('devuelve false cuando la vacante no está disponible', async () => {
    prisma.jobOffer.findFirst.mockResolvedValue(null);

    await expect(repository.isOfferOpen('offer-1', new Date())).resolves.toBe(
      false,
    );
  });

  it('busca el estado por título', async () => {
    prisma.jobApplicationStatus.findUnique.mockResolvedValue({
      id: 'status-1',
    });

    await expect(repository.findStatusId('En revisión')).resolves.toEqual({
      id: 'status-1',
    });
    expect(prisma.jobApplicationStatus.findUnique).toHaveBeenCalledWith({
      where: { title: 'En revisión' },
      select: { id: true },
    });
  });

  it('busca la postulación por la clave única vacante + usuario', async () => {
    prisma.jobApplication.findUnique.mockResolvedValue(null);

    await repository.findByUserAndOffer('user-1', 'offer-1');

    expect(prisma.jobApplication.findUnique).toHaveBeenCalledWith({
      where: { jobOfferId_userId: { jobOfferId: 'offer-1', userId: 'user-1' } },
      select: SELECT,
    });
  });

  it('crea la postulación con el estado indicado', async () => {
    prisma.jobApplication.create.mockResolvedValue({ id: 'application-1' });

    await repository.create('user-1', 'offer-1', 'status-1');

    expect(prisma.jobApplication.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', jobOfferId: 'offer-1', statusId: 'status-1' },
      select: SELECT,
    });
  });
});
