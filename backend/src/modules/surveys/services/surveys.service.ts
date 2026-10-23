import { Injectable } from '@nestjs/common';
import {
  CareerNotFoundException,
  InvalidSurveyScheduleException,
  SurveyTitleAlreadyExistsException,
} from '../exceptions/index.js';
import { SurveyMapper } from '../mappers/survey.mapper.js';
import { CareersRepository } from '../repositories/careers.repository.js';
import { SurveysRepository } from '../repositories/surveys.repository.js';
import type { CreateSurveyRequest } from '../requests/create-survey.schema.js';
import type { SurveyCreatedResponse } from '../responses/survey-created.response.js';
import type { SurveySummaryResponse } from '../responses/survey-summary.response.js';
import { getScheduleError } from '../utils/survey-schedule.js';

@Injectable()
export class SurveysService {
  constructor(
    private readonly surveysRepository: SurveysRepository,
    private readonly careersRepository: CareersRepository,
    private readonly surveyMapper: SurveyMapper,
  ) {}

  async create(
    createdById: string,
    request: CreateSurveyRequest,
    now: Date = new Date(),
  ): Promise<SurveyCreatedResponse> {
    const data = this.surveyMapper.toCreateData(request, createdById);

    if (data.careerId) {
      await this.ensureCareerExists(data.careerId);
    }

    if (request.status === 'published' && data.opensAt && data.closesAt) {
      const scheduleError = getScheduleError(data.opensAt, data.closesAt, now);
      if (scheduleError) throw new InvalidSurveyScheduleException(scheduleError);
    }

    const titleTaken = await this.surveysRepository.existsWithTitle({
      title: data.title,
      careerId: data.careerId,
      academicPeriod: data.academicPeriod,
    });
    if (titleTaken) throw new SurveyTitleAlreadyExistsException();

    const record = await this.surveysRepository.create(data);
    return this.surveyMapper.toCreatedResponse(record);
  }

  async listSurveys(): Promise<SurveySummaryResponse[]> {
    const records = await this.surveysRepository.findAll();
    return records.map((record) => this.surveyMapper.toSummaryResponse(record));
  }

  private async ensureCareerExists(careerId: string): Promise<void> {
    const exists = await this.careersRepository.exists(careerId);
    if (!exists) throw new CareerNotFoundException();
  }
}
