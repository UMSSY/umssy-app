import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { RadarApplicationsRepository } from '../repositories/radar-applications.repository.js';

@Injectable()
export class RadarApplicationConsentsService {
  constructor(private readonly repository: RadarApplicationsRepository) {}
  recordRequired(applicationId: string, context: TransactionContext) {
    return this.repository.setConsents(
      applicationId,
      true,
      true,
      true,
      context,
    );
  }
}
