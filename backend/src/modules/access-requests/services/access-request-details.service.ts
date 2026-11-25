import { Injectable } from '@nestjs/common';
import { AccessRequestDetailsRepository } from '../repositories/access-request-details.repository.js';
import type { AccessRequestApplicantDetails } from '../types/access-request-applicant-details.types.js';

@Injectable()
export class AccessRequestDetailsService {
  constructor(private readonly repository: AccessRequestDetailsRepository) {}

  getApplicantDetails(
    accessRequestId: string,
  ): Promise<AccessRequestApplicantDetails | null> {
    return this.repository.findApplicantDetails(accessRequestId);
  }
}
