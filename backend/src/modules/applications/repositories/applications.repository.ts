import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { FindApplicationsQueryDto } from '../requests/find-applications.request.js';

@Injectable()
export class ApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string, query: FindApplicationsQueryDto) {
    const { status, sortBy, sortOrder = 'desc' } = query;

    const whereClause: any = { userId };
    
    if (status) {
      whereClause.status = {
        title: status,
      };
    }

    const orderByClause: any = {};
    if (sortBy === 'vacancy') {
      orderByClause.jobOffer = { title: sortOrder };
    } else if (sortBy === 'company') {
      orderByClause.jobOffer = { company: { title: sortOrder } };
    } else if (sortBy === 'status') {
      orderByClause.status = { title: sortOrder };
    } else {
      orderByClause.createdAt = sortOrder;
    }

    return this.prisma.jobApplication.findMany({
      where: whereClause,
      orderBy: orderByClause,
      include: {
        status: true,
        jobOffer: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.jobApplication.findUnique({
      where: { id },
      include: {
        status: true,
        jobOffer: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, statusId: string) {
    return this.prisma.jobApplication.update({
      where: { id },
      data: {
        statusId: statusId,
      },
    });
  }
}