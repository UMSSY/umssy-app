import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { Injectable } from '@nestjs/common';
import { CvFileRepository } from '../repositories/cv-file.repository.js';

@Injectable()
export class CvSourcesService {
  findVerificationSources(userId: string, context?: TransactionContext) {
    return this.repository.findVerificationSources(userId, context);
  }
  constructor(private readonly repository: CvFileRepository) {}

  currentCv(userId: string) {
    return this.repository.currentCv(userId);
  }

  cvById(cvId: string) {
    return this.repository.cvById(cvId);
  }
}
