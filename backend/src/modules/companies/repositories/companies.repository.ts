import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { COMPANY_PROFILE_SELECT } from '../constants/company-profile.constants.js';
import { FEATURED_COMPANY_SELECT } from '../constants/featured-companies.constants.js';
import type { CompanyProfileRecord } from '../types/company-profile-record.type.js';
import type { FeaturedCompanyRecord } from '../types/featured-company-record.type.js';

@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProfile(companyId: string): Promise<CompanyProfileRecord | null> {
    return this.prisma.company.findUnique({
      where: { id: companyId },
      select: COMPANY_PROFILE_SELECT,
    });
  }

  findFeaturedCandidates(
    companyIds: string[],
  ): Promise<FeaturedCompanyRecord[]> {
    return this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: FEATURED_COMPANY_SELECT,
    });
  }
}
