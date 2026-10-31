import type { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobOfferUnavailableException } from '../exceptions/job-offer-unavailable.exception.js';
import { JobApplicationMapper } from '../mappers/job-application.mapper.js';
import type { JobApplicationsRepository } from '../repositories/job-applications.repository.js';
import { CompanyJobApplicantsService } from '../services/company-job-applicants.service.js';
import type { JobApplicantRecord } from '../types/company-job-applicants.types.js';

const COMPANY_ID = 'company-1';
const OFFER_ID = 'offer-1';
const OFFER = { id: OFFER_ID, title: 'DevOps Senior' };

const APPLICANT: JobApplicantRecord = {
  id: 'application-1',
  appliedAt: new Date('2026-11-10T14:00:00.000Z'),
  status: { title: 'En revisión' },
  user: {
    id: 'user-1',
    firstName: 'Ana',
    lastName: 'Rojas',
    email: 'ana@umss.edu.bo',
    headline: 'Ingeniera de Sistemas',
  },
};

describe('HU-02B - CompanyJobApplicantsService', () => {
  const repository = {
    findApplicantsByOffer: vi.fn(),
  };
  const jobOffers = { findCompanyOffer: vi.fn() };
  let service: CompanyJobApplicantsService;

  beforeEach(() => {
    vi.resetAllMocks();
    jobOffers.findCompanyOffer.mockResolvedValue(OFFER);
    repository.findApplicantsByOffer.mockResolvedValue([APPLICANT]);
    service = new CompanyJobApplicantsService(
      repository as unknown as JobApplicationsRepository,
      jobOffers as unknown as JobOffersService,
      new JobApplicationMapper(),
    );
  });

  it('devuelve cuántos y quiénes se postularon a la vacante de la empresa', async () => {
    await expect(service.listByOffer(COMPANY_ID, OFFER_ID)).resolves.toEqual({
      jobOfferId: OFFER_ID,
      jobTitle: 'DevOps Senior',
      total: 1,
      applicants: [
        {
          id: 'application-1',
          userId: 'user-1',
          fullName: 'Ana Rojas',
          email: 'ana@umss.edu.bo',
          headline: 'Ingeniera de Sistemas',
          appliedAt: '2026-11-10T14:00:00.000Z',
          status: 'En revisión',
        },
      ],
    });
    expect(jobOffers.findCompanyOffer).toHaveBeenCalledWith(
      COMPANY_ID,
      OFFER_ID,
    );
    expect(repository.findApplicantsByOffer).toHaveBeenCalledWith(OFFER_ID);
  });

  it('devuelve total 0 cuando nadie se postuló', async () => {
    repository.findApplicantsByOffer.mockResolvedValue([]);

    await expect(
      service.listByOffer(COMPANY_ID, OFFER_ID),
    ).resolves.toMatchObject({
      total: 0,
      applicants: [],
    });
  });

  it('responde 404 si la vacante no existe o es de otra empresa', async () => {
    jobOffers.findCompanyOffer.mockResolvedValue(null);

    await expect(
      service.listByOffer(COMPANY_ID, OFFER_ID),
    ).rejects.toBeInstanceOf(JobOfferUnavailableException);
    expect(repository.findApplicantsByOffer).not.toHaveBeenCalled();
  });
});
