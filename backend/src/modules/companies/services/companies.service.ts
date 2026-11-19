import { Injectable, NotFoundException } from '@nestjs/common';
import { CompaniesRepository } from '../repositories/companies.repository.js';
import { CompanyMainProfileResponse } from '../responses/company-main-profile.response.js';

@Injectable()
export class CompaniesService {
  constructor(private readonly repository: CompaniesRepository) {}

  async getCompanyMainProfile(
    companyId: string,
  ): Promise<CompanyMainProfileResponse> {
    const profile = await this.repository.findProfileByCompanyId(companyId);

    if (!profile) {
      throw new NotFoundException('Company profile not found');
    }

    return {
      name: profile.company.title,
      sector: profile.sector,
      city: profile.city.title,
      phone: profile.phone,
      email: profile.email,
      description: profile.company.description ?? 'Sin descripción',
      website: profile.websiteUrl ?? null,
      logoUrl: profile.company.logo ? `/api/companies/${companyId}/logo` : null,
    };
  }
}