import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JobOfferStatus } from '../../job-offers/types/job-offer.enum.js';
import { JOB_MATCH_SELECT } from '../constants/job-match.constants.js';
import type { JobMatchRecord } from '../types/job-match.types.js';

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
}
