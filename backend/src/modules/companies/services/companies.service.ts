import { Injectable } from '@nestjs/common';
import { CompanyNotFoundException } from '../exceptions/company-not-found.exception.js';
import { CompaniesRepository } from '../repositories/companies.repository.js';
import type { CompanyProfileResponse } from '../responses/company-profile.response.js';
import { toCompanyProfileResponse } from '../utils/to-company-profile-response.js';

@Injectable()
export class CompaniesService {
  constructor(private readonly repository: CompaniesRepository) {}

  async getProfile(companyId: string): Promise<CompanyProfileResponse> {
    const record = await this.repository.findProfile(companyId);
    if (!record) throw new CompanyNotFoundException();
    return toCompanyProfileResponse(record);
  }
}
