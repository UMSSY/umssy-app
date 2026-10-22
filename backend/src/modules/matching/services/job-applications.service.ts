import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/client.js';
import {
  JOB_APPLICATION_STATUS,
  UNIQUE_VIOLATION_CODE,
} from '../constants/job-application.constants.js';
import { DuplicateJobApplicationException } from '../exceptions/duplicate-job-application.exception.js';
import { JobApplicationStatusMissingException } from '../exceptions/job-application-status-missing.exception.js';
import { JobOfferUnavailableException } from '../exceptions/job-offer-unavailable.exception.js';
import { JobApplicationsRepository } from '../repositories/job-applications.repository.js';
import type {
  JobApplicationRecord,
  JobApplicationResponse,
  MyJobApplicationResponse,
} from '../types/job-application.types.js';

function toResponse(record: JobApplicationRecord): JobApplicationResponse {
  return {
    id: record.id,
    jobOfferId: record.jobOffer.id,
    jobTitle: record.jobOffer.title,
    companyName: record.jobOffer.company.title,
    appliedAt: record.appliedAt.toISOString(),
    status: record.status.title,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION_CODE
  );
}

@Injectable()
export class JobApplicationsService {
  constructor(private readonly repository: JobApplicationsRepository) {}

  async apply(userId: string, jobOfferId: string): Promise<JobApplicationResponse> {
    if (!(await this.repository.isOfferOpen(jobOfferId, new Date()))) {
      throw new JobOfferUnavailableException();
    }

    if (await this.repository.findByUserAndOffer(userId, jobOfferId)) {
      throw new DuplicateJobApplicationException();
    }

    const status = await this.repository.findStatusId(JOB_APPLICATION_STATUS.IN_REVIEW);
    if (!status) {
      throw new JobApplicationStatusMissingException();
    }

    try {
      return toResponse(await this.repository.create(userId, jobOfferId, status.id));
    } catch (error) {
      // Dos clics simultáneos: la restricción única (job_offer_id, user_id) decide.
      if (isUniqueViolation(error)) {
        throw new DuplicateJobApplicationException();
      }
      throw error;
    }
  }

  async findMine(userId: string, jobOfferId: string): Promise<MyJobApplicationResponse> {
    const record = await this.repository.findByUserAndOffer(userId, jobOfferId);
    return { hasApplied: record !== null, application: record ? toResponse(record) : null };
  }
}
