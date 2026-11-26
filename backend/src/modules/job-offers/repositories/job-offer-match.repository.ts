import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JOB_MATCH_SELECT } from '../constants/job-match.constants.js';
import type { JobOfferMatchRecord } from '../types/job-match-record.types.js';
import { buildPublishedJobOfferWhere } from '../utils/build-published-job-offer-where.js';

@Injectable()
export class JobOfferMatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublishedById(
    jobOfferId: string,
    now: Date,
  ): Promise<JobOfferMatchRecord | null> {
    return this.prisma.jobOffer.findFirst({
      where: { id: jobOfferId, ...buildPublishedJobOfferWhere(now) },
      select: JOB_MATCH_SELECT,
    });
  }

  findPublished(now: Date): Promise<JobOfferMatchRecord[]> {
    return this.prisma.jobOffer.findMany({
      where: buildPublishedJobOfferWhere(now),
      orderBy: { createdAt: 'desc' },
      select: JOB_MATCH_SELECT,
    });
  }
}
