import { describe, expect, it, beforeEach, vi } from 'vitest';
import { JobApplicationsService } from '../services/job-applications.service.js';
import { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { NotImplementedException } from '@nestjs/common';

describe('JobApplicationsService', () => {
  let service: JobApplicationsService;
  let jobOffersService: JobOffersService;
  let prisma: PrismaService;

  beforeEach(() => {
    jobOffersService = {} as JobOffersService;
    prisma = {} as PrismaService;

    service = new JobApplicationsService(jobOffersService, prisma);
  });

  it('lanza NotImplementedException hasta que exista la tabla D-02', async () => {
    await expect(service.apply('user-1', 'job-1')).rejects.toThrow(NotImplementedException);
  });
});