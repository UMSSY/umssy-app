import { Injectable } from '@nestjs/common';
import { EducationsRepository } from '../repositories/educations.repository.js';
import type { EducationAnalysisSourceResponse } from '../responses/education-analysis-source.response.js';

@Injectable()
export class EducationSourcesService {
  constructor(private readonly repository: EducationsRepository) {}

  findAnalysisSources(userId: string): Promise<EducationAnalysisSourceResponse[]> {
    return this.repository.findAnalysisSources(userId);
  }
}
