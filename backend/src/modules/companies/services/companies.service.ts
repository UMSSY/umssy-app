import { Injectable } from '@nestjs/common';
import { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { CompanyNotFoundException } from '../exceptions/company-not-found.exception.js';
import { CompaniesRepository } from '../repositories/companies.repository.js';
import type { CompanyProfileResponse } from '../responses/company-profile.response.js';
import type { FeaturedCompanyResponse } from '../responses/featured-company.response.js';
import { toCompanyProfileResponse } from '../utils/to-company-profile-response.js';
import { toFeaturedCompanies } from '../utils/to-featured-companies.js';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly repository: CompaniesRepository,
    private readonly jobOffersService: JobOffersService,
  ) {}

  async getProfile(companyId: string): Promise<CompanyProfileResponse> {
    const record = await this.repository.findProfile(companyId);
    if (!record) throw new CompanyNotFoundException();
    return toCompanyProfileResponse(record);
  }

  async listFeatured(): Promise<FeaturedCompanyResponse[]> {
    const counts = await this.jobOffersService.countActiveOffersByCompany(
      new Date(),
    );
    if (counts.length === 0) return [];
    const records = await this.repository.findFeaturedCandidates(
      counts.map(({ companyId }) => companyId),
    );
    return toFeaturedCompanies(records, counts);
  }
}
