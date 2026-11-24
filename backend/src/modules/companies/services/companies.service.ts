import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

const PUBLISHED_JOB_OFFER_STATUS = 'Publicada';
const MAX_FEATURED_COMPANIES = 6;

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompaniesSummaryForHome() {
    const now = new Date();

    const activeOfferFilter = {
      status: {
        title: PUBLISHED_JOB_OFFER_STATUS,
      },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    const companies = await this.prisma.company.findMany({
      where: {
        jobOffers: {
          some: activeOfferFilter,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        _count: {
          select: {
            jobOffers: {
              where: activeOfferFilter,
            },
          },
        },
      },
    });

    return companies
      .sort(
        (a, b) =>
          b._count.jobOffers - a._count.jobOffers ||
          a.title.localeCompare(b.title, 'es'),
      )
      .slice(0, MAX_FEATURED_COMPANIES)
      .map((company) => ({
        id: company.id,
        name: company.title,
        description: company.description ?? 'Empresa destacada en UMSSY',
        logoUrl: null,
        activeVacanciesCount: company._count.jobOffers,
      }));
  }
}