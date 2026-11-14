import type { TransactionService } from '../../../common/prisma/transaction.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import type { RadarApplicationConsentsService } from '../../radar-integration/services/radar-application-consents.service.js';
import { JobApplicationConsentRequiredException } from '../exceptions/job-application-consent-required.exception.js';
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
const CONSENTS = {
  consent: true,
  consentCv: true,
  consentContact: true,
} as const;
const context = { client: {} } as TransactionContext;
const consents = { recordRequired: vi.fn() };
const transactions = { run: vi.fn() };

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
    reactivate: vi.fn(),
  };
  let service: JobApplicationsService;

  beforeEach(() => {
    vi.resetAllMocks();
    transactions.run.mockImplementation((operation) => operation(context));
    repository.isOfferOpen.mockResolvedValue(true);
    repository.findByUserAndOffer.mockResolvedValue(null);
    repository.findStatusId.mockResolvedValue({ id: 'status-in-review' });
    repository.create.mockResolvedValue(RECORD);
    repository.reactivate.mockResolvedValue(RECORD);
    service = new JobApplicationsService(
      repository as unknown as JobApplicationsRepository,
      new JobApplicationMapper(),
      transactions as unknown as TransactionService,
      consents as unknown as RadarApplicationConsentsService,
    );
  });

  it('AC-02.7: crea la postulación en estado "En revisión" y devuelve el resumen', async () => {
    await expect(service.apply(USER_ID, OFFER_ID, CONSENTS)).resolves.toEqual(
      RESPONSE,
    );

    expect(repository.findStatusId).toHaveBeenCalledWith('En revisión');
    expect(repository.create).toHaveBeenCalledWith(
      USER_ID,
      OFFER_ID,
      'status-in-review',
      context,
    );
  });

  it('rejects missing consent before creating an application', async () => {
    await expect(service.apply(USER_ID, OFFER_ID)).rejects.toBeInstanceOf(
      JobApplicationConsentRequiredException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects absent or denied contact consent even when CV and radar are authorized', async () => {
    for (const contact of [undefined, false]) {
      const denied = {
        consent: true,
        consentCv: true,
        consentContact: contact,
      } as unknown as Parameters<JobApplicationsService['apply']>[2];
      await expect(
        service.apply(USER_ID, OFFER_ID, denied),
      ).rejects.toBeInstanceOf(JobApplicationConsentRequiredException);
    }
    expect(repository.create).not.toHaveBeenCalled();
    expect(consents.recordRequired).not.toHaveBeenCalled();
  });
  it('records the two consents in the same transaction', async () => {
    await service.apply(USER_ID, OFFER_ID, CONSENTS);
    expect(consents.recordRequired).toHaveBeenCalledWith(RECORD.id, context);
    consents.recordRequired.mockRejectedValue(new Error('consent failure'));
    await expect(service.apply(USER_ID, OFFER_ID, CONSENTS)).rejects.toThrow(
      'consent failure',
    );
  });
  it('AC-02.8: rechaza una segunda postulación a la misma vacante', async () => {
    repository.findByUserAndOffer.mockResolvedValue(RECORD);

    await expect(
      service.apply(USER_ID, OFFER_ID, CONSENTS),
    ).rejects.toBeInstanceOf(DuplicateJobApplicationException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('permite volver a postular cuando la postulación fue retirada', async () => {
    repository.findByUserAndOffer.mockResolvedValue({
      ...RECORD,
      status: { title: 'Retirada' },
    });

    await expect(service.apply(USER_ID, OFFER_ID, CONSENTS)).resolves.toEqual(
      RESPONSE,
    );
    expect(repository.reactivate).toHaveBeenCalledWith(
      USER_ID,
      OFFER_ID,
      'status-in-review',
      context,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rechaza la reactivación si otra operación cambió el estado', async () => {
    repository.findByUserAndOffer.mockResolvedValue({
      ...RECORD,
      status: { title: 'Retirada' },
    });
    repository.reactivate.mockResolvedValue(null);

    await expect(
      service.apply(USER_ID, OFFER_ID, CONSENTS),
    ).rejects.toBeInstanceOf(DuplicateJobApplicationException);
  });

  it('AC-02.8: convierte la violación de unicidad de dos clics simultáneos en duplicado', async () => {
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.apply(USER_ID, OFFER_ID, CONSENTS),
    ).rejects.toBeInstanceOf(DuplicateJobApplicationException);
  });

  it('propaga otros errores de base de datos', async () => {
    const failure = new Error('connection lost');
    repository.create.mockRejectedValue(failure);

    await expect(service.apply(USER_ID, OFFER_ID, CONSENTS)).rejects.toBe(
      failure,
    );
  });

  it('rechaza postularse a una vacante no publicada o vencida', async () => {
    repository.isOfferOpen.mockResolvedValue(false);

    await expect(
      service.apply(USER_ID, OFFER_ID, CONSENTS),
    ).rejects.toBeInstanceOf(JobOfferUnavailableException);
    expect(repository.findByUserAndOffer).not.toHaveBeenCalled();
  });

  it('falla de forma explícita si falta el estado inicial en el catálogo', async () => {
    repository.findStatusId.mockResolvedValue(null);

    await expect(
      service.apply(USER_ID, OFFER_ID, CONSENTS),
    ).rejects.toBeInstanceOf(JobApplicationStatusMissingException);
  });

  it('indica que el usuario ya se postuló', async () => {
    repository.findByUserAndOffer.mockResolvedValue(RECORD);

    await expect(service.findMine(USER_ID, OFFER_ID)).resolves.toEqual({
      hasApplied: true,
      application: RESPONSE,
    });
  });

  it('permite mostrar el botón si la postulación está retirada', async () => {
    repository.findByUserAndOffer.mockResolvedValue({
      ...RECORD,
      status: { title: 'Retirada' },
    });

    await expect(service.findMine(USER_ID, OFFER_ID)).resolves.toEqual({
      hasApplied: false,
      application: null,
    });
  });

  it('indica que el usuario aún no se postuló', async () => {
    await expect(service.findMine(USER_ID, OFFER_ID)).resolves.toEqual({
      hasApplied: false,
      application: null,
    });
  });
});
