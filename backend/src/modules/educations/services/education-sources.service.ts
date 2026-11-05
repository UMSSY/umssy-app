import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { EducationsRepository } from '../repositories/educations.repository.js';
import type { EducationAnalysisSourceResponse } from '../responses/education-analysis-source.response.js';

@Injectable()
export class EducationSourcesService {
  constructor(private readonly repository: EducationsRepository) {}

  findPublicationEvidenceIds(userId: string, context: TransactionContext) {
    return this.repository.findPublicationEvidenceIds(userId, context);
  }

  findAnalysisSources(userId: string): Promise<EducationAnalysisSourceResponse[]> {
    return this.repository.findAnalysisSources(userId);
  }
}
