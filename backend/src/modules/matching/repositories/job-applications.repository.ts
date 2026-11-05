import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JobOfferStatus } from '../../job-offers/types/job-offer.enum.js';
import { ApplicationStatus } from '../../applications/types/applications.types.js';
import { ACTIVE_JOB_APPLICATION_WHERE } from '../constants/job-application.constants.js';
import type { JobApplicantRecord } from '../types/company-job-applicants.types.js';
import type { JobApplicationRecord } from '../types/job-application.types.js';

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

const JOB_APPLICANT_SELECT = {
  id: true,
  appliedAt: true,
  status: { select: { title: true } },
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      headline: true,
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

  async reactivate(
    userId: string,
    jobOfferId: string,
    statusId: string,
  ): Promise<JobApplicationRecord | null> {
    const result = await this.prisma.jobApplication.updateMany({
      where: {
        userId,
        jobOfferId,
        status: { title: ApplicationStatus.WITHDRAWN },
      },
      data: { statusId, appliedAt: new Date() },
    });
    if (result.count !== 1) return null;
    return this.findByUserAndOffer(userId, jobOfferId);
  }

  findApplicantsByOffer(jobOfferId: string): Promise<JobApplicantRecord[]> {
    return this.prisma.jobApplication.findMany({
      where: { jobOfferId, ...ACTIVE_JOB_APPLICATION_WHERE },
      orderBy: [{ appliedAt: 'desc' }, { id: 'desc' }],
      select: JOB_APPLICANT_SELECT,
    });
  }
}
