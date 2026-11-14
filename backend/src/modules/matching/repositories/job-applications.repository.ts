import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JobOfferStatus } from '../../job-offers/types/job-offer.enum.js';
import {
  ACTIVE_JOB_APPLICATION_WHERE,
  JOB_APPLICATION_STATUS,
} from '../constants/job-application.constants.js';
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
  radarConsent: { select: { consentToContact: true } },
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
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
    context?: TransactionContext,
  ): Promise<JobApplicationRecord | null> {
    const client = context?.client ?? this.prisma;
    return client.jobApplication.findUnique({
      where: { jobOfferId_userId: { jobOfferId, userId } },
      select: JOB_APPLICATION_SELECT,
    });
  }

  create(
    userId: string,
    jobOfferId: string,
    statusId: string,
    context?: TransactionContext,
  ): Promise<JobApplicationRecord> {
    const client = context?.client ?? this.prisma;
    return client.jobApplication.create({
      data: { userId, jobOfferId, statusId },
      select: JOB_APPLICATION_SELECT,
    });
  }

  async reactivate(
    userId: string,
    jobOfferId: string,
    statusId: string,
    context?: TransactionContext,
  ): Promise<JobApplicationRecord | null> {
    const client = context?.client ?? this.prisma;
    const result = await client.jobApplication.updateMany({
      where: {
        userId,
        jobOfferId,
        status: { title: JOB_APPLICATION_STATUS.WITHDRAWN },
      },
      data: { statusId, appliedAt: new Date() },
    });
    if (result.count !== 1) return null;
    return this.findByUserAndOffer(userId, jobOfferId, context);
  }

  findApplicantsByOffer(jobOfferId: string): Promise<JobApplicantRecord[]> {
    return this.prisma.jobApplication.findMany({
      where: { jobOfferId, ...ACTIVE_JOB_APPLICATION_WHERE },
      orderBy: [{ appliedAt: 'desc' }, { id: 'desc' }],
      select: JOB_APPLICANT_SELECT,
    });
  }
}
