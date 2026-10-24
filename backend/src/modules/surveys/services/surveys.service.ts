import { Injectable } from '@nestjs/common';
import {
  CareerNotFoundException,
  InvalidSurveyScheduleException,
  SurveyNotEditableException,
  SurveyNotFoundException,
  SurveyTitleAlreadyExistsException,
} from '../exceptions/index.js';
import { SurveyMapper } from '../mappers/survey.mapper.js';
import { CareersRepository } from '../repositories/careers.repository.js';
import { SurveysRepository } from '../repositories/surveys.repository.js';
import type { CreateSurveyRequest } from '../requests/create-survey.schema.js';
import type { SurveyCreatedResponse } from '../responses/survey-created.response.js';
import type { SurveyDetailResponse } from '../responses/survey-detail.response.js';
import type { SurveyStatisticsResponse } from '../responses/survey-statistics.response.js';
import type { SurveySummaryResponse } from '../responses/survey-summary.response.js';
import type { UpdateSurveyData } from '../types/create-survey-data.type.js';
import { SurveyStatus } from '../types/survey.enum.js';
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

  async getDetail(id: string): Promise<SurveyDetailResponse> {
    const record = await this.surveysRepository.findDetail(id);
    if (!record) throw new SurveyNotFoundException();
    return this.surveyMapper.toDetailResponse(record);
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

  async listSurveys(): Promise<SurveySummaryResponse[]> {
    const records = await this.surveysRepository.findAll();
    return records.map((record) => this.surveyMapper.toSummaryResponse(record));
  }

  async getStatistics(id: string): Promise<SurveyStatisticsResponse> {
    const record = await this.surveysRepository.findStatistics(id);
    if (!record) throw new SurveyNotFoundException();
    return this.surveyMapper.toStatisticsResponse(record);
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

  private async ensureCareerExists(careerId: string): Promise<void> {
    const exists = await this.careersRepository.exists(careerId);
    if (!exists) throw new CareerNotFoundException();
  }
}
