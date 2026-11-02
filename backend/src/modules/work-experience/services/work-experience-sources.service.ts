import { Injectable } from '@nestjs/common';
import { WorkExperienceRepository } from '../repositories/work-experience.repository.js';
import type { WorkExperienceAnalysisSourceResponse } from '../responses/work-experience-analysis-source.response.js';

@Injectable()
export class WorkExperienceSourcesService {
  constructor(private readonly repository: WorkExperienceRepository) {}

  findAnalysisSources(userId: string): Promise<WorkExperienceAnalysisSourceResponse[]> {
    return this.repository.findAnalysisSources(userId);
  }
}
