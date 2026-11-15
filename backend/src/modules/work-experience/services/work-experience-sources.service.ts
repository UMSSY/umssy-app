import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { WorkExperienceRepository } from '../repositories/work-experience.repository.js';
import type { WorkExperienceAnalysisSourceResponse } from '../responses/work-experience-analysis-source.response.js';

@Injectable()
export class WorkExperienceSourcesService {
  constructor(private readonly repository: WorkExperienceRepository) {}

  hasByUserId(userId: string): Promise<boolean> {
    return this.repository.hasByUserId(userId);
  }

  findPublicationEvidenceIds(userId: string, context: TransactionContext) {
    return this.repository.findPublicationEvidenceIds(userId, context);
  }

  findAnalysisSources(
    userId: string,
  ): Promise<WorkExperienceAnalysisSourceResponse[]> {
    return this.repository.findAnalysisSources(userId);
  }

  findRecruitmentEvidence(userId: string, ids: string[]) {
    return this.repository.findRecruitmentEvidence(userId, ids);
  }
}
