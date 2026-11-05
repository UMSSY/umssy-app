import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { CertificationsRepository } from '../repositories/certifications.repository.js';

@Injectable()
export class CertificationSourcesService {
  constructor(private readonly repository: CertificationsRepository) {}

  findPublicationEvidenceIds(userId: string, context: TransactionContext) {
    return this.repository.findPublicationEvidenceIds(userId, context);
  }

  findManyByUserId(userId: string) {
    return this.repository.findManyByUserId(userId);
  }
}
