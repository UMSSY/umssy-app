import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JobOfferStatus } from '../../job-offers/types/job-offer.enum.js';
import type { JobApplicationRecord } from '../types/job-application.types.js';
import type {
  MyApplicationRecord,
  OwnedApplicationRecord,
} from '../types/my-applications.types.js';

const JOB_APPLICATION_SELECT = {
  id: true,
  appliedAt: true,
  status: { select: { title: true } },
  jobOffer: {
    select: {
      id: true,
      title: true,
      company: { select: { title: true } },
    },
  },
} as const;

@Injectable()
export class JobApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isOfferOpen(jobOfferId: string, now: Date): Promise<boolean> {
    const offer = await this.prisma.jobOffer.findFirst({
      where: {
        id: jobOfferId,
        status: { title: JobOfferStatus.PUBLISHED },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    });
    return offer !== null;
  }

  findStatusId(title: string): Promise<{ id: string } | null> {
    return this.prisma.jobApplicationStatus.findUnique({
      where: { title },
      select: { id: true },
    });
  }

  findByUserAndOffer(
    userId: string,
    jobOfferId: string,
  ): Promise<JobApplicationRecord | null> {
    return this.prisma.jobApplication.findUnique({
      where: { jobOfferId_userId: { jobOfferId, userId } },
      select: JOB_APPLICATION_SELECT,
    });
  }

  create(
    userId: string,
    jobOfferId: string,
    statusId: string,
  ): Promise<JobApplicationRecord> {
    return this.prisma.jobApplication.create({
      data: { userId, jobOfferId, statusId },
      select: JOB_APPLICATION_SELECT,
    });
  }

  findAllByUser(userId: string): Promise<MyApplicationRecord[]> {
    return this.prisma.jobApplication.findMany({
      where: { userId },
      orderBy: [{ appliedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        appliedAt: true,
        jobOfferId: true,
        status: { select: { title: true } },
        jobOffer: {
          select: { title: true, company: { select: { title: true } } },
        },
      },
    });
  }

  findOwned(
    applicationId: string,
    userId: string,
  ): Promise<OwnedApplicationRecord | null> {
    return this.prisma.jobApplication.findFirst({
      where: { id: applicationId, userId },
      select: { id: true, status: { select: { title: true } } },
    });
  }

  async updateStatus(applicationId: string, statusId: string): Promise<void> {
    await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { statusId },
    });
  }
}
