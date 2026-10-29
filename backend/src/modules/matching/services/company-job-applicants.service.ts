import { Injectable } from '@nestjs/common';
import { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { JobApplicationMapper } from '../mappers/job-application.mapper.js';
import { JobApplicationsRepository } from '../repositories/job-applications.repository.js';
import type { CompanyJobApplicantsResponse } from '../types/company-job-applicants.types.js';

@Injectable()
export class CompanyJobApplicantsService {
  constructor(
    private readonly jobOffersService: JobOffersService,
    private readonly repository: JobApplicationsRepository,
    private readonly mapper: JobApplicationMapper,
  ) {}

  async listByOffer(
    companyId: string,
    jobOfferId: string,
  ): Promise<CompanyJobApplicantsResponse> {
    const offer = await this.jobOffersService.getByCompanyAndId(companyId, jobOfferId);
    const applicants = await this.repository.findApplicantsByOffer(offer.id);
    return this.mapper.toCompanyApplicantsResponse(offer, applicants);
  }
}
