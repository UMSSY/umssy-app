import { Injectable } from '@nestjs/common';
import type {
  JobApplicationRecord,
  JobApplicationResponse,
  MyJobApplicationResponse,
} from '../types/job-application.types.js';

@Injectable()
export class JobApplicationMapper {
  toResponse(record: JobApplicationRecord): JobApplicationResponse {
    return {
      id: record.id,
      jobOfferId: record.jobOffer.id,
      jobTitle: record.jobOffer.title,
      companyName: record.jobOffer.company.title,
      appliedAt: record.appliedAt.toISOString(),
      status: record.status.title,
    };
  }

  toMyApplicationResponse(
    record: JobApplicationRecord | null,
  ): MyJobApplicationResponse {
    return {
      hasApplied: record !== null,
      application: record ? this.toResponse(record) : null,
    };
  }
}
