import { Injectable } from '@nestjs/common';
import { toSurveyEmploymentResponse } from '../mappers/survey-employment-response.mapper.js';
import { SurveyEmploymentResponsesRepository } from '../repositories/survey-employment-responses.repository.js';
import type { SurveyEmploymentResponse } from '../responses/survey-employment-response.response.js';
import type { SurveyEmploymentResponseFilter } from '../types/survey-employment-response-filter.type.js';

@Injectable()
export class SurveyEmploymentResponsesService {
  constructor(
    private readonly repository: SurveyEmploymentResponsesRepository,
  ) {}

  async findEmploymentResponses(
    filter: SurveyEmploymentResponseFilter,
  ): Promise<SurveyEmploymentResponse[]> {
    const records = await this.repository.findMany(filter);
    return records.map(toSurveyEmploymentResponse);
  }
}
