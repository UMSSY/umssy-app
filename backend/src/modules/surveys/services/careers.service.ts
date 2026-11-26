import { Injectable } from '@nestjs/common';
import { SurveyMapper } from '../mappers/survey.mapper.js';
import { CareersRepository } from '../repositories/careers.repository.js';
import type { CareerResponse } from '../responses/career.response.js';
import type { CareerSortOrder } from '../types/career-sort-order.type.js';

@Injectable()
export class CareersService {
  constructor(
    private readonly careersRepository: CareersRepository,
    private readonly surveyMapper: SurveyMapper,
  ) {}

  async listCareers(
    sortOrder: CareerSortOrder = 'asc',
  ): Promise<CareerResponse[]> {
    const careers = await this.careersRepository.findAll(sortOrder);
    return careers.map((career) => this.surveyMapper.toCareerResponse(career));
  }
}
