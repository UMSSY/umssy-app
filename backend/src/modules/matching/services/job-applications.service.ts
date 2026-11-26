import { TransactionService } from '../../../common/prisma/transaction.service.js';
import { RadarApplicationConsentsService } from '../../radar-integration/services/radar-application-consents.service.js';
import type { JobApplicationConsentsRequest } from '../requests/job-application-consents.request.js';
import { JobApplicationConsentRequiredException } from '../exceptions/job-application-consent-required.exception.js';
import { UNIQUE_CONSTRAINT_VIOLATION_CODE } from '../../../common/constants/prisma-errors.constants.js';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/client.js';
import { JOB_APPLICATION_STATUS } from '../constants/job-application.constants.js';
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
    error.code === UNIQUE_CONSTRAINT_VIOLATION_CODE
  );
}

@Injectable()
export class JobApplicationsService {
  constructor(
    private readonly repository: JobApplicationsRepository,
    private readonly mapper: JobApplicationMapper,
    private readonly transactions: TransactionService,
    private readonly consents: RadarApplicationConsentsService,
  ) {}

  async apply(
    userId: string,
    jobOfferId: string,
    consents?: JobApplicationConsentsRequest,
  ): Promise<JobApplicationResponse> {
    if (
      consents?.consent !== true ||
      consents?.consentCv !== true ||
      consents?.consentContact !== true
    )
      throw new JobApplicationConsentRequiredException();
    if (!(await this.repository.isOfferOpen(jobOfferId, new Date()))) {
      throw new JobOfferUnavailableException();
    }

    const existing = await this.repository.findByUserAndOffer(
      userId,
      jobOfferId,
    );
    if (
      existing &&
      existing.status.title !== JOB_APPLICATION_STATUS.WITHDRAWN
    ) {
      throw new DuplicateJobApplicationException();
    }

    const status = await this.repository.findStatusId(
      JOB_APPLICATION_STATUS.IN_REVIEW,
    );
    if (!status) {
      throw new JobApplicationStatusMissingException();
    }

    try {
      return await this.transactions.run(async (context) => {
        const application = existing
          ? await this.repository.reactivate(
              userId,
              jobOfferId,
              status.id,
              context,
            )
          : await this.repository.create(
              userId,
              jobOfferId,
              status.id,
              context,
            );
        if (!application) throw new DuplicateJobApplicationException();
        await this.consents.recordRequired(application.id, context);
        return this.mapper.toResponse(application);
      });
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
