import { Injectable } from '@nestjs/common';
import type { ApplicationRecord } from '../types/application-record.types.js';
import type { ApplicationContactResponse } from '../types/application-contact-response.types.js';
import type { ApplicationDecisionContext } from '../types/application-decision-context.types.js';
import type { CompanyRecruiter } from '../../users/types/company-recruiter.types.js';
import type { ApplicationItemResponse } from '../types/applications.types.js';
@Injectable()
export class ApplicationMapper {
  toResponse(
    record: ApplicationRecord,
    affinityPercentage: number,
  ): ApplicationItemResponse {
    return {
      id: record.id,
      jobOfferId: record.jobOfferId,
      vacancyTitle: record.jobOffer.title,
      companyName: record.jobOffer.company.title,
      affinityPercentage,
      status: record.status.title,
      appliedDate: new Date(record.appliedAt).toISOString(),
    };
  }

  toContactResponse(
    context: ApplicationDecisionContext,
    recruiters: CompanyRecruiter[],
  ): ApplicationContactResponse {
    return {
      applicationId: context.id,
      jobOfferId: context.jobOfferId,
      vacancyTitle: context.jobTitle,
      companyId: context.companyId,
      companyName: context.companyName,
      recruiters: recruiters.map((recruiter) => ({
        id: recruiter.id,
        fullName: `${recruiter.firstName} ${recruiter.lastName}`,
      })),
    };
  }
}
