import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async getCompaniesSummaryForHome() {
    const companies = await this.prisma.company.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        _count: {
          select: {
            jobOffers: {
              where: {
                status: {
                  title: 'Publicado'
                }
              }
            }
          }
        }
      },
      orderBy: {
        jobOffers: {
          _count: 'desc'
        }
      },
      take: 6,
    });

    return companies.map(company => ({
      id: company.id,
      name: company.title,
      description: company.description ?? 'Empresa destacada en UMSSY',
      logoUrl: null,
      activeVacanciesCount: company._count.jobOffers,
    }));
  }
}