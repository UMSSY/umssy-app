import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JobOfferStatus } from '../../job-offers/types/job-offer.enum.js';
import { JOB_MATCH_SELECT } from '../constants/job-match.constants.js';
import type { JobMatchRecord } from '../types/job-match.types.js';

@Injectable()
export class JobMatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublishedById(
    jobOfferId: string,
    now: Date,
  ): Promise<JobMatchRecord | null> {
    return this.prisma.jobOffer.findFirst({
      where: {
        id: jobOfferId,
        status: { title: JobOfferStatus.PUBLISHED },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: JOB_MATCH_SELECT,
    });
  }
}
