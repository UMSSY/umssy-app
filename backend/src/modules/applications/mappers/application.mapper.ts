import { Injectable } from '@nestjs/common';
import type { ApplicationRecord } from '../types/application-record.types.js';
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
      appliedDate: record.appliedAt.toISOString(),
    };
  }
}
