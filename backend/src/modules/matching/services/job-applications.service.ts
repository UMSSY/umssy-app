import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/client.js';
import {
  JOB_APPLICATION_STATUS,
  UNIQUE_VIOLATION_CODE,
} from '../constants/job-application.constants.js';
import { DuplicateJobApplicationException } from '../exceptions/duplicate-job-application.exception.js';
import { JobApplicationStatusMissingException } from '../exceptions/job-application-status-missing.exception.js';
import { JobOfferUnavailableException } from '../exceptions/job-offer-unavailable.exception.js';
import { JobApplicationMapper } from '../mappers/job-application.mapper.js';
import { JobApplicationsRepository } from '../repositories/job-applications.repository.js';
import type {
  JobApplicationResponse,
  MyJobApplicationResponse,
} from '../types/job-application.types.js';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_VIOLATION_CODE
  );
}

@Injectable()
export class JobApplicationsService {
  constructor(
    private readonly repository: JobApplicationsRepository,
    private readonly mapper: JobApplicationMapper,
  ) {}

  async apply(
    userId: string,
    jobOfferId: string,
  ): Promise<JobApplicationResponse> {
    if (!(await this.repository.isOfferOpen(jobOfferId, new Date()))) {
      throw new JobOfferUnavailableException();
    }

    if (await this.repository.findByUserAndOffer(userId, jobOfferId)) {
      throw new DuplicateJobApplicationException();
    }

    const status = await this.repository.findStatusId(
      JOB_APPLICATION_STATUS.IN_REVIEW,
    );
    if (!status) {
      throw new JobApplicationStatusMissingException();
    }

    try {
      return this.mapper.toResponse(
        await this.repository.create(userId, jobOfferId, status.id),
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateJobApplicationException();
      }
      throw error;
    }
  }

  async findMine(
    userId: string,
    jobOfferId: string,
  ): Promise<MyJobApplicationResponse> {
    return this.mapper.toMyApplicationResponse(
      await this.repository.findByUserAndOffer(userId, jobOfferId),
    );
  }
}
