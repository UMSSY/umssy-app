import { Injectable } from '@nestjs/common';
import { JobOfferUnavailableException } from '../exceptions/job-offer-unavailable.exception.js';
import { JobApplicationMapper } from '../mappers/job-application.mapper.js';
import { JobApplicationsRepository } from '../repositories/job-applications.repository.js';
import type { CompanyJobApplicantsResponse } from '../types/company-job-applicants.types.js';

@Injectable()
export class CompanyJobApplicantsService {
  constructor(
    private readonly repository: JobApplicationsRepository,
    private readonly mapper: JobApplicationMapper,
  ) {}

  async listByOffer(
    companyId: string,
    jobOfferId: string,
  ): Promise<CompanyJobApplicantsResponse> {
    const offer = await this.repository.findCompanyOffer(companyId, jobOfferId);
    if (!offer) {
      throw new JobOfferUnavailableException();
    }

    const applicants = await this.repository.findApplicantsByOffer(offer.id);
    return this.mapper.toCompanyApplicantsResponse(offer, applicants);
  }
}
