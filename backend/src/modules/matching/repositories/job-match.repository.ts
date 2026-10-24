import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JobOfferStatus } from '../../job-offers/types/job-offer.enum.js';
import { JOB_MATCH_SELECT } from '../constants/job-match.constants.js';
import type {
  CandidateProfileRecord,
  JobMatchRecord,
} from '../types/job-match.types.js';
import { calculateExperienceYears } from '../utils/calculate-experience-years.js';

function publishedWhere(now: Date) {
  return {
    status: { title: JobOfferStatus.PUBLISHED },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

@Injectable()
export class JobMatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublishedById(
    jobOfferId: string,
    now: Date,
  ): Promise<JobMatchRecord | null> {
    return this.prisma.jobOffer.findFirst({
      where: { id: jobOfferId, ...publishedWhere(now) },
      select: JOB_MATCH_SELECT,
    });
  }

  findPublished(now: Date): Promise<JobMatchRecord[]> {
    return this.prisma.jobOffer.findMany({
      where: publishedWhere(now),
      orderBy: { createdAt: 'desc' },
      select: JOB_MATCH_SELECT,
    });
  }

  async findCandidateProfile(userId: string): Promise<CandidateProfileRecord> {
    const [education, experiences] = await Promise.all([
      this.prisma.education.findFirst({
        where: { userId },
        orderBy: { startDate: 'desc' },
        select: { degree: true },
      }),
      this.prisma.workExperience.findMany({
        where: { userId },
        select: { startDate: true, endDate: true, isCurrent: true },
      }),
    ]);

    return {
      career: education?.degree ?? null,
      experienceYears: calculateExperienceYears(experiences, new Date()),
    };
  }
}
