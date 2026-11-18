import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProfileByCompanyId(companyId: string) {
    return this.prisma.companyProfile.findUnique({
      where: { companyId },
      include: {
        company: true,
        city: true,
      },
    });
  }
}