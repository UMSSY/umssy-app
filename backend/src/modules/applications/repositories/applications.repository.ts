import { Injectable } from '@nestjs/common';
import { JobOfferStatus } from '../../job-offers/types/job-offer.enum.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FindApplicationsQueryDto } from '../requests/find-applications.request.js';

@Injectable()
export class ApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string, query: FindApplicationsQueryDto) {
    const where: Prisma.JobApplicationWhereInput = {
      userId,
      ...(query.status ? { status: { title: query.status } } : {}),
    };
    const direction = query.sortOrder;
    const orderBy: Prisma.JobApplicationOrderByWithRelationInput =
      query.sortBy === 'vacancy'
        ? { jobOffer: { title: direction } }
        : query.sortBy === 'company'
          ? { jobOffer: { company: { title: direction } } }
          : query.sortBy === 'status'
            ? { status: { title: direction } }
            : { appliedAt: direction };
    return this.prisma.jobApplication.findMany({
      where,
      orderBy: [orderBy, { id: direction }],
      select: {
        id: true,
        jobOfferId: true,
        appliedAt: true,
        status: { select: { title: true } },
        jobOffer: {
          select: { title: true, company: { select: { title: true } } },
        },
      },
    });
  }

  findById(id: string) {
    return this.prisma.jobApplication.findUnique({
      where: { id },
      select: { id: true, userId: true, status: { select: { title: true } } },
    });
  }

  reactivateApplication(id: string, userId: string, now: Date) {
    return this.prisma.$transaction(async (tx) => {
      const status = await tx.jobApplicationStatus.findUniqueOrThrow({
        where: { title: 'En revisión' },
        select: { id: true },
      });

      return tx.jobApplication.updateMany({
        where: {
          id,
          userId,
          status: { title: 'Retirada' },
          jobOffer: {
            status: { title: JobOfferStatus.PUBLISHED },
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        },
        data: { statusId: status.id, appliedAt: now },
      });
    });
  }

  withdraw(id: string, userId: string, statuses: string[], title: string) {
    return this.prisma.$transaction(async (tx) => {
      const status = await tx.jobApplicationStatus.findUniqueOrThrow({
        where: { title },
        select: { id: true },
      });
      return tx.jobApplication.updateMany({
        where: { id, userId, status: { title: { in: statuses } } },
        data: { statusId: status.id },
      });
    });
  }
}
