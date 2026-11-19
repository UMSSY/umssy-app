import { Controller, Get } from '@nestjs/common';
import { CompaniesService } from '../services/companies.service.js';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('home-summary')
  async getHomeSummary() {
    return await this.companiesService.getCompaniesSummaryForHome();
  }
}