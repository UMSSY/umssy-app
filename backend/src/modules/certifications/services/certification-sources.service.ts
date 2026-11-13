import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { CertificationRecordsService } from './certification-records.service.js';

@Injectable()
export class CertificationSourcesService {
  constructor(private readonly repository: CertificationRecordsService) {}

  hasByUserId(userId: string): Promise<boolean> {
    return this.repository.hasByUserId(userId);
  }

  findPublicationEvidenceIds(userId: string, context: TransactionContext) {
    return this.repository.findPublicationEvidenceIds(userId, context);
  }

  findManyByUserId(userId: string) {
    return this.repository.findManyByUserId(userId);
  }
}
