import { Injectable } from '@nestjs/common';
import type { ApplicationRecord } from '../types/application-record.types.js';
import type {
  ApplicationContactRecord,
  ApplicationContactResponse,
} from '../types/application-contact.types.js';
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
    record: ApplicationContactRecord,
  ): ApplicationContactResponse {
    const { company } = record.jobOffer;
    return {
      applicationId: record.id,
      jobOfferId: record.jobOfferId,
      vacancyTitle: record.jobOffer.title,
      companyId: company.id,
      companyName: company.title,
      recruiters: company.recruiters.map((recruiter) => ({
        id: recruiter.id,
        fullName: `${recruiter.firstName} ${recruiter.lastName}`,
      })),
    };
  }
}
