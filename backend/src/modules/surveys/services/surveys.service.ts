import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CareerNotFoundException,
  InvalidSurveyScheduleException,
  SurveyAlreadyAnsweredException,
  SurveyExpiredException,
  SurveyNotAvailableException,
  SurveyNotEditableException,
  SurveyNotFoundException,
  SurveyTitleAlreadyExistsException,
} from '../exceptions/index.js';
import { SurveyMapper } from '../mappers/survey.mapper.js';
import { CareersRepository } from '../repositories/careers.repository.js';
import { SurveysRepository } from '../repositories/surveys.repository.js';
import type { CreateSurveyRequest } from '../requests/create-survey.schema.js';
import type { SubmitSurveyResponseRequest } from '../requests/submit-survey-response.schema.js';
import type { SurveyCreatedResponse } from '../responses/survey-created.response.js';
import type { SurveyDetailResponse } from '../responses/survey-detail.response.js';
import type { SurveyNotificationResponse } from '../responses/survey-notification.response.js';
import type { SurveyStatisticsResponse } from '../responses/survey-statistics.response.js';
import type { SurveySummaryResponse } from '../responses/survey-summary.response.js';
import { SURVEYS_ROLE } from '../constants/surveys-access.constants.js';
import type { UpdateSurveyData } from '../types/create-survey-data.type.js';
import { SurveyStatus } from '../types/survey.enum.js';
import { isSurveyForGraduate } from '../utils/is-survey-for-graduate.js';
import { getScheduleError } from '../utils/survey-schedule.js';

import { ReportHistoryService } from '../../reports/services/report-history.service.js';
import { SurveyPdfService } from './survey-pdf.service.js';

@Injectable()
export class SurveysService {
  constructor(
    private readonly surveysRepository: SurveysRepository,
    private readonly careersRepository: CareersRepository,
    private readonly surveyMapper: SurveyMapper,
    private readonly surveyPdfService: SurveyPdfService,
    private readonly reportHistoryService: ReportHistoryService,
  ) {}

  async create(
    createdById: string,
    request: CreateSurveyRequest,
    now: Date = new Date(),
  ): Promise<SurveyCreatedResponse> {
    const data = this.surveyMapper.toCreateData(request, createdById);
    await this.ensureSurveyIsValid(data, request, now);

    const record = await this.surveysRepository.create(data);
    return this.surveyMapper.toCreatedResponse(record);
  }

  async getDetail(id: string, now: Date = new Date()): Promise<SurveyDetailResponse> {
    const record = await this.surveysRepository.findDetail(id);
    if (!record) throw new SurveyNotFoundException();
    return this.surveyMapper.toDetailResponse(record, now);
  }

  async update(
    id: string,
    request: CreateSurveyRequest,
    now: Date = new Date(),
  ): Promise<SurveyCreatedResponse> {
    const current = await this.surveysRepository.findStatus(id);
    if (!current) throw new SurveyNotFoundException();
    if (current.status !== SurveyStatus.DRAFT) throw new SurveyNotEditableException();

    const data = this.surveyMapper.toUpdateData(request);
    await this.ensureSurveyIsValid(data, request, now, id);

    const record = await this.surveysRepository.update(id, data);
    return this.surveyMapper.toCreatedResponse(record);
  }

  async listSurveys(now: Date = new Date()): Promise<SurveySummaryResponse[]> {
    const records = await this.surveysRepository.findAll();
    return records.map((record) => this.surveyMapper.toSummaryResponse(record, now));
  }

  async getStatistics(id: string, now: Date = new Date()): Promise<SurveyStatisticsResponse> {
    const record = await this.surveysRepository.findStatistics(id);
    if (!record) throw new SurveyNotFoundException();
    return this.surveyMapper.toStatisticsResponse(record, now);
  }

  async exportSurveyPdf(
    id: string,
    userId: string,
  ): Promise<{ fileName: string; buffer: Buffer }> {
    const stats = await this.getStatistics(id);
    const buffer = await this.surveyPdfService.generatePdf(stats);

    const safeTitle = stats.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);

    const dateSuffix = new Date().toISOString().slice(0, 10);
    const fileName = `reporte-encuesta-${safeTitle || 'estadisticas'}-${dateSuffix}.pdf`;

    await this.reportHistoryService.registerGeneratedReport(userId, {
      fileName,
      reportType: 'SURVEY_STATISTICS',
    });

    return { fileName, buffer };
  }

  async getNotificationsForUser(userId: string): Promise<SurveyNotificationResponse[]> {
    const graduate = await this.surveysRepository.findGraduateProfile(userId);
    if (!graduate) return [];
    return this.surveysRepository.findNotificationsForUser(userId, graduate);
  }

  async getSurveyForAnswering(
    id: string,
    userId: string,
    sessionRoles: readonly string[] = [],
  ): Promise<SurveyDetailResponse> {
    const survey = await this.surveysRepository.findByIdWithQuestions(id, userId);
    if (!survey) throw new SurveyNotFoundException();
    if (!sessionRoles.includes(SURVEYS_ROLE)) {
      if (survey.status !== 'published') throw new SurveyNotFoundException();
      await this.ensureSurveyIsForGraduate(survey, userId);
    }
    return survey;
  }

  async submitResponse(
    id: string,
    userId: string,
    request: SubmitSurveyResponseRequest,
    sessionRoles: readonly string[] = [],
  ): Promise<{ success: boolean; message: string }> {
    const survey = await this.surveysRepository.findByIdWithQuestions(id, userId);
    if (!survey || survey.status !== 'published') {
      throw new SurveyNotFoundException();
    }

    if (!sessionRoles.includes(SURVEYS_ROLE)) {
      await this.ensureSurveyIsForGraduate(survey, userId);
    }

    if (survey.isExpired) {
      throw new SurveyExpiredException();
    }

    if (survey.hasAnswered) {
      throw new SurveyAlreadyAnsweredException();
    }

    for (const q of survey.questions) {
      if (q.isRequired) {
        const answer = request.answers.find((a) => a.questionId === q.id);
        if (!answer || answer.optionIds.length === 0) {
          throw new BadRequestException(`La pregunta "${q.statement}" es obligatoria`);
        }
      }
    }

    for (const ans of request.answers) {
      const q = survey.questions.find((question) => question.id === ans.questionId);
      if (q && q.type === 'single_choice' && ans.optionIds.length > 1) {
        throw new BadRequestException(`La pregunta "${q.statement}" solo permite una respuesta`);
      }
    }

    await this.surveysRepository.submitResponse(id, userId, request.answers);
    return { success: true, message: 'Respuestas guardadas con éxito' };
  }

  private async ensureSurveyIsValid(
    data: UpdateSurveyData,
    request: CreateSurveyRequest,
    now: Date,
    excludedId?: string,
  ): Promise<void> {
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
      excludedId,
    });
    if (titleTaken) throw new SurveyTitleAlreadyExistsException();
  }

  private async ensureSurveyIsForGraduate(
    survey: SurveyDetailResponse,
    userId: string,
  ): Promise<void> {
    const graduate = await this.surveysRepository.findGraduateProfile(userId);
    if (!graduate || !isSurveyForGraduate(survey, graduate)) {
      throw new SurveyNotAvailableException();
    }
  }

  private async ensureCareerExists(careerId: string): Promise<void> {
    const exists = await this.careersRepository.exists(careerId);
    if (!exists) throw new CareerNotFoundException();
  }
}

