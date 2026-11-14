import { Injectable } from '@nestjs/common';
import { recruiterContactProjection } from '../../radar-integration/recruiter-consent.js';
import { JOB_APPLICATION_STATUS } from '../constants/job-application.constants.js';
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
    if (!record || record.status.title === JOB_APPLICATION_STATUS.WITHDRAWN) {
      return {
        hasApplied: false,
        application: null,
      };
    }
    return {
      hasApplied: true,
      application: this.toResponse(record),
    };
  }

  toApplicantResponse(record: JobApplicantRecord): JobApplicantResponse {
    return {
      id: record.id,
      userId: record.user.id,
      fullName: `${record.user.firstName} ${record.user.lastName}`.trim(),
      ...recruiterContactProjection(
        record.status.title !== JOB_APPLICATION_STATUS.WITHDRAWN &&
          record.radarConsent?.consentToContact === true,
        record.user.email,
        record.user.phone ?? null,
      ),
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
