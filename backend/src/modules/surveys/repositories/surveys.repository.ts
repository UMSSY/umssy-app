import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  SURVEY_CREATED_SELECT,
  SURVEY_DETAIL_INCLUDE,
  SURVEY_STATISTICS_INCLUDE,
  SURVEY_SUMMARY_SELECT,
} from '../constants/survey.constants.js';
import { SurveysStorageUnavailableException } from '../exceptions/surveys-storage-unavailable.exception.js';
import type {
  CreateSurveyData,
  UpdateSurveyData,
} from '../types/create-survey-data.type.js';
import type {
  SurveysDatabaseClient,
  SurveysTransactionClient,
} from '../types/surveys-database-client.type.js';
import type {
  SurveyCreatedRecord,
  SurveyDetailRecord,
  SurveyStatisticsRecord,
  SurveySummaryRecord,
  SurveyTitleScope,
} from '../types/survey-record.type.js';
import type { SurveyStatus } from '../types/survey.enum.js';

@Injectable()
export class SurveysRepository {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: usar this.prisma directamente cuando DevOps agregue los modelos Survey, SurveyQuestion y SurveyQuestionOption al schema de Prisma
  private get database(): SurveysDatabaseClient {
    const database = this.prisma as unknown as Partial<SurveysDatabaseClient>;
    if (!database.survey) throw new SurveysStorageUnavailableException();
    return database as SurveysDatabaseClient;
  }

  async existsWithTitle({
    title,
    careerId,
    academicPeriod,
    excludedId,
  }: SurveyTitleScope): Promise<boolean> {
    const survey = await this.database.survey.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
        careerId,
        academicPeriod,
        ...(excludedId ? { id: { not: excludedId } } : {}),
      },
      select: { id: true },
    });
    return survey !== null;
  }

  async create(data: CreateSurveyData): Promise<SurveyCreatedRecord> {
    const { questions, ...survey } = data;
    const { questionRows, optionRows } = this.toQuestionRows(questions);

    return this.database.$transaction(async (tx: SurveysTransactionClient) => {
      const created = await tx.survey.create({
        data: survey,
        select: SURVEY_CREATED_SELECT,
      });

      if (questionRows.length > 0) {
        await tx.surveyQuestion.createMany({
          data: questionRows.map((row) => ({ ...row, surveyId: created.id })),
        });
      }

      if (optionRows.length > 0) {
        await tx.surveyQuestionOption.createMany({ data: optionRows });
      }

      return created;
    });
  }

  async findAll(): Promise<SurveySummaryRecord[]> {
    return this.database.survey.findMany({
      select: SURVEY_SUMMARY_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  findDetail(surveyId: string): Promise<SurveyDetailRecord | null> {
    return this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: SURVEY_DETAIL_INCLUDE,
    });
  }

  findStatus(surveyId: string): Promise<{ status: SurveyStatus } | null> {
    return this.prisma.survey.findUnique({
      where: { id: surveyId },
      select: { status: true },
    });
  }

  update(surveyId: string, data: UpdateSurveyData): Promise<SurveyCreatedRecord> {
    const { questions, ...survey } = data;
    const { questionRows, optionRows } = this.toQuestionRows(questions);

    return this.prisma.$transaction(async (tx) => {
      await tx.surveyQuestion.deleteMany({ where: { surveyId } });

      const updated = await tx.survey.update({
        where: { id: surveyId },
        data: survey,
        select: SURVEY_CREATED_SELECT,
      });

      if (questionRows.length > 0) {
        await tx.surveyQuestion.createMany({
          data: questionRows.map((row) => ({ ...row, surveyId })),
        });
      }

      if (optionRows.length > 0) {
        await tx.surveyQuestionOption.createMany({ data: optionRows });
      }

      return updated;
    });
  }

  findStatistics(surveyId: string): Promise<SurveyStatisticsRecord | null> {
    return this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: SURVEY_STATISTICS_INCLUDE,
    });
  }

  private toQuestionRows(questions: CreateSurveyData['questions']) {
    const questionRows = questions.map((question, index) => ({
      id: randomUUID(),
      position: index + 1,
      statement: question.statement,
      type: question.type,
      isRequired: question.isRequired,
    }));
    const optionRows = questions.flatMap((question, questionIndex) =>
      question.options.map((option, optionIndex) => ({
        questionId: questionRows[questionIndex].id,
        position: optionIndex + 1,
        label: option.label,
      })),
    );
    return { questionRows, optionRows };
  }
}

