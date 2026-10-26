import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JobOffersService } from '../../job-offers/services/job-offers.service.js';

export interface JobApplicationResponse {
  jobOfferId: string;
  company: string;
  appliedAt: string;
  status: string;
}

@Injectable()
export class JobApplicationsService {
  constructor(
    private readonly jobOffersService: JobOffersService,
    private readonly prisma: PrismaService,
  ) {}

  async apply(userId: string, jobOfferId: string): Promise<JobApplicationResponse> {
    throw new NotImplementedException('Pendiente tabla D-02');
  }
}