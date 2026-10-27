import { Injectable } from '@nestjs/common';
import { SurveyMapper } from '../mappers/survey.mapper.js';
import { CareersRepository } from '../repositories/careers.repository.js';
import type { CareerResponse } from '../responses/career.response.js';

@Injectable()
export class CareersService {
  constructor(
    private readonly careersRepository: CareersRepository,
    private readonly surveyMapper: SurveyMapper,
  ) {}

  async listCareers(): Promise<CareerResponse[]> {
    const careers = await this.careersRepository.findAll();
    return careers.map((career) => this.surveyMapper.toCareerResponse(career));
  }
}
