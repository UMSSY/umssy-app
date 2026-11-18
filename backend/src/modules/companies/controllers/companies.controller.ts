import { Controller, Get, Param } from '@nestjs/common';
import { CompaniesService } from '../services/companies.service.js';
import { CompanyMainProfileResponse } from '../responses/company-main-profile.response.js';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get(':companyId/profile')
  async getCompanyMainProfile(
    @Param('companyId') companyId: string,
  ): Promise<CompanyMainProfileResponse> {
    return this.companiesService.getCompanyMainProfile(companyId);
  }
}