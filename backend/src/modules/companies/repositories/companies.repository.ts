import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { COMPANY_PROFILE_SELECT } from '../constants/company-profile.constants.js';
import type { CompanyProfileRecord } from '../types/company-profile-record.type.js';

@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProfile(companyId: string): Promise<CompanyProfileRecord | null> {
    return this.prisma.company.findUnique({
      where: { id: companyId },
      select: COMPANY_PROFILE_SELECT,
    });
  }
}
