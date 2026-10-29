import { Injectable } from '@nestjs/common';
import type {
  CompanyJobApplicantsResponse,
  CompanyJobOfferRecord,
  JobApplicantRecord,
  JobApplicantResponse,
} from '../types/company-job-applicants.types.js';
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

  toApplicantResponse(record: JobApplicantRecord): JobApplicantResponse {
    return {
      id: record.id,
      userId: record.user.id,
      fullName: `${record.user.firstName} ${record.user.lastName}`.trim(),
      email: record.user.email,
      headline: record.user.headline,
      appliedAt: record.appliedAt.toISOString(),
      status: record.status.title,
    };
  }

  toCompanyApplicantsResponse(
    offer: CompanyJobOfferRecord,
    records: JobApplicantRecord[],
  ): CompanyJobApplicantsResponse {
    return {
      jobOfferId: offer.id,
      jobTitle: offer.title,
      total: records.length,
      applicants: records.map((record) => this.toApplicantResponse(record)),
    };
  }
}
