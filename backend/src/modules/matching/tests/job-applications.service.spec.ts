import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../prisma/client.js';
import { DuplicateJobApplicationException } from '../exceptions/duplicate-job-application.exception.js';
import { JobApplicationStatusMissingException } from '../exceptions/job-application-status-missing.exception.js';
import { JobOfferUnavailableException } from '../exceptions/job-offer-unavailable.exception.js';
import { JobApplicationMapper } from '../mappers/job-application.mapper.js';
import type { JobApplicationsRepository } from '../repositories/job-applications.repository.js';
import { JobApplicationsService } from '../services/job-applications.service.js';
import type { JobApplicationRecord } from '../types/job-application.types.js';

const USER_ID = 'user-1';
const OFFER_ID = 'offer-1';

const RECORD: JobApplicationRecord = {
  id: 'application-1',
  appliedAt: new Date('2026-11-10T14:00:00.000Z'),
  status: { title: 'En revisión' },
  jobOffer: {
    id: OFFER_ID,
    title: 'DevOps Senior',
    company: { title: 'TechBolivia' },
  },
};

const RESPONSE = {
  id: 'application-1',
  jobOfferId: OFFER_ID,
  jobTitle: 'DevOps Senior',
  companyName: 'TechBolivia',
  appliedAt: '2026-11-10T14:00:00.000Z',
  status: 'En revisión',
};

describe('HU-02B T2.8 - JobApplicationsService', () => {
  const repository = {
    isOfferOpen: vi.fn(),
    findStatusId: vi.fn(),
    findByUserAndOffer: vi.fn(),
    create: vi.fn(),
  };
  let service: JobApplicationsService;

  beforeEach(() => {
    vi.resetAllMocks();
    repository.isOfferOpen.mockResolvedValue(true);
    repository.findByUserAndOffer.mockResolvedValue(null);
    repository.findStatusId.mockResolvedValue({ id: 'status-in-review' });
    repository.create.mockResolvedValue(RECORD);
    service = new JobApplicationsService(
      repository as unknown as JobApplicationsRepository,
      new JobApplicationMapper(),
    );
  });

  it('AC-02.7: crea la postulación en estado "En revisión" y devuelve el resumen', async () => {
    await expect(service.apply(USER_ID, OFFER_ID)).resolves.toEqual(RESPONSE);

    expect(repository.findStatusId).toHaveBeenCalledWith('En revisión');
    expect(repository.create).toHaveBeenCalledWith(
      USER_ID,
      OFFER_ID,
      'status-in-review',
    );
  });

  it('AC-02.8: rechaza una segunda postulación a la misma vacante', async () => {
    repository.findByUserAndOffer.mockResolvedValue(RECORD);

    await expect(service.apply(USER_ID, OFFER_ID)).rejects.toBeInstanceOf(
      DuplicateJobApplicationException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('AC-02.8: convierte la violación de unicidad de dos clics simultáneos en duplicado', async () => {
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.apply(USER_ID, OFFER_ID)).rejects.toBeInstanceOf(
      DuplicateJobApplicationException,
    );
  });

  it('propaga otros errores de base de datos', async () => {
    const failure = new Error('connection lost');
    repository.create.mockRejectedValue(failure);

    await expect(service.apply(USER_ID, OFFER_ID)).rejects.toBe(failure);
  });

  it('rechaza postularse a una vacante no publicada o vencida', async () => {
    repository.isOfferOpen.mockResolvedValue(false);

    await expect(service.apply(USER_ID, OFFER_ID)).rejects.toBeInstanceOf(
      JobOfferUnavailableException,
    );
    expect(repository.findByUserAndOffer).not.toHaveBeenCalled();
  });

  it('falla de forma explícita si falta el estado inicial en el catálogo', async () => {
    repository.findStatusId.mockResolvedValue(null);

    await expect(service.apply(USER_ID, OFFER_ID)).rejects.toBeInstanceOf(
      JobApplicationStatusMissingException,
    );
  });

  it('indica que el usuario ya se postuló', async () => {
    repository.findByUserAndOffer.mockResolvedValue(RECORD);

    await expect(service.findMine(USER_ID, OFFER_ID)).resolves.toEqual({
      hasApplied: true,
      application: RESPONSE,
    });
  });

  it('indica que el usuario aún no se postuló', async () => {
    await expect(service.findMine(USER_ID, OFFER_ID)).resolves.toEqual({
      hasApplied: false,
      application: null,
    });
  });
});
