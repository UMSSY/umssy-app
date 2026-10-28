import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import {
  CAREER_SELECT,
  CATALOG_TITLE_SELECT,
  SURVEY_ALL_ACADEMIC_PERIODS,
  SURVEY_CREATED_SELECT,
  SURVEY_DETAIL_INCLUDE,
  SURVEY_STATISTICS_INCLUDE,
  SURVEY_SUMMARY_SELECT,
} from '../constants/survey.constants.js';
import { SurveysStorageUnavailableException } from '../exceptions/surveys-storage-unavailable.exception.js';
import type { SurveyDetailResponse } from '../responses/survey-detail.response.js';
import type { SurveyNotificationResponse } from '../responses/survey-notification.response.js';
import type {
  CreateSurveyData,
  UpdateSurveyData,
} from '../types/create-survey-data.type.js';
import type {
  SurveyCreatedRecord,
  SurveyDetailRecord,
  SurveyStatisticsRecord,
  SurveySummaryRecord,
  SurveyTitleScope,
} from '../types/survey-record.type.js';
import type { GraduateProfile } from '../types/graduate-profile.type.js';
import { SurveyStatus } from '../types/survey.enum.js';
import {
  toSurveyQuestionTypeValue,
  toSurveyStatusValue,
} from '../utils/survey-catalog-values.js';

@Injectable()
export class SurveysRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsWithTitle({
    title,
    careerId,
    academicPeriod,
    excludedId,
  }: SurveyTitleScope): Promise<boolean> {
    const survey = await this.prisma.survey.findFirst({
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
    const { questions, status, ...survey } = data;

    return this.prisma.$transaction(async (tx) => {
      const catalogs = await this.findCatalogIds(tx);
      const { questionRows, optionRows } = this.toQuestionRows(questions, catalogs.typeIds);
      const created = await tx.survey.create({
        data: { ...survey, statusId: this.requireCatalogId(catalogs.statusIds, status) },
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
    return this.prisma.survey.findMany({
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

  async findStatus(surveyId: string): Promise<{ status: string } | null> {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      select: { status: CATALOG_TITLE_SELECT },
    });
    return survey ? { status: survey.status.title } : null;
  }

  update(surveyId: string, data: UpdateSurveyData): Promise<SurveyCreatedRecord> {
    const { questions, status, ...survey } = data;

    return this.prisma.$transaction(async (tx) => {
      const catalogs = await this.findCatalogIds(tx);
      const { questionRows, optionRows } = this.toQuestionRows(questions, catalogs.typeIds);
      await tx.surveyQuestion.deleteMany({ where: { surveyId } });

      const updated = await tx.survey.update({
        where: { id: surveyId },
        data: { ...survey, statusId: this.requireCatalogId(catalogs.statusIds, status) },
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

  async findGraduateProfile(userId: string): Promise<GraduateProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) return null;

    return this.prisma.accessRequest.findFirst({
      where: {
        email: user.email,
        status: { title: { equals: 'approved', mode: 'insensitive' } },
      },
      select: { careerId: true, graduationYear: true },
    });
  }

  async findNotificationsForUser(
    userId: string,
    graduate: GraduateProfile,
  ): Promise<SurveyNotificationResponse[]> {
    const surveys = await this.prisma.survey.findMany({
      where: {
        status: { title: SurveyStatus.PUBLISHED },
        AND: [
          { OR: [{ careerId: null }, { careerId: graduate.careerId }] },
          {
            OR: [
              { academicPeriod: null },
              { academicPeriod: SURVEY_ALL_ACADEMIC_PERIODS },
              { academicPeriod: { endsWith: String(graduate.graduationYear) } },
            ],
          },
        ],
      },
      include: {
        responses: {
          where: { respondentId: userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    return surveys.map((s) => {
      const hasAnswered = s.responses.length > 0;
      let status: 'pending' | 'expired' | 'answered';

      if (hasAnswered) {
        status = 'answered';
      } else if (s.closesAt && new Date(s.closesAt) < now) {
        status = 'expired';
      } else {
        status = 'pending';
      }

      const publishedDate = s.opensAt ?? s.createdAt;

      return {
        id: s.id,
        title: s.title,
        publishedAt: publishedDate.toISOString(),
        status,
      };
    });
  }

  async findByIdWithQuestions(id: string, userId: string): Promise<SurveyDetailResponse | null> {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        career: { select: CAREER_SELECT },
        status: CATALOG_TITLE_SELECT,
        questions: {
          orderBy: { position: 'asc' },
          include: {
            type: CATALOG_TITLE_SELECT,
            options: {
              orderBy: { position: 'asc' },
            },
          },
        },
        responses: {
          where: { respondentId: userId },
          select: { id: true },
        },
      },
    });

    if (!survey) return null;

    const hasAnswered = survey.responses.length > 0;
    const isExpired = survey.closesAt ? new Date(survey.closesAt) < new Date() : false;

    return {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: toSurveyStatusValue(survey.status.title),
      career: survey.career ? { id: survey.career.id, title: survey.career.title } : null,
      academicPeriod: survey.academicPeriod,
      opensAt: survey.opensAt?.toISOString() ?? null,
      closesAt: survey.closesAt?.toISOString() ?? null,
      hasAnswered,
      isExpired,
      questions: survey.questions.map((q) => ({
        id: q.id,
        position: q.position,
        statement: q.statement,
        type: toSurveyQuestionTypeValue(q.type.title),
        isRequired: q.isRequired,
        options: q.options.map((opt) => ({
          id: opt.id,
          position: opt.position,
          label: opt.label,
        })),
      })),
    };
  }

  async submitResponse(
    surveyId: string,
    userId: string,
    answers: { questionId: string; optionIds: string[] }[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const createdResponse = await tx.surveyResponse.create({
        data: {
          surveyId,
          respondentId: userId,
        },
      });

      const answerRows = answers.flatMap((ans) =>
        ans.optionIds.map((optId) => ({
          responseId: createdResponse.id,
          questionId: ans.questionId,
          optionId: optId,
        })),
      );

      if (answerRows.length > 0) {
        await tx.surveyAnswer.createMany({
          data: answerRows,
        });
      }
    });
  }

  private async findCatalogIds(tx: Prisma.TransactionClient) {
    const [statuses, types] = await Promise.all([
      tx.surveyStatus.findMany({ select: { id: true, title: true } }),
      tx.surveyQuestionType.findMany({ select: { id: true, title: true } }),
    ]);
    return {
      statusIds: new Map(statuses.map(({ id, title }) => [title, id])),
      typeIds: new Map(types.map(({ id, title }) => [title, id])),
    };
  }

  private requireCatalogId(ids: ReadonlyMap<string, string>, title: string): string {
    const id = ids.get(title);
    if (!id) throw new SurveysStorageUnavailableException();
    return id;
  }

  private toQuestionRows(
    questions: CreateSurveyData['questions'],
    typeIds: ReadonlyMap<string, string>,
  ) {
    const questionRows = questions.map((question, index) => ({
      id: randomUUID(),
      position: index + 1,
      statement: question.statement,
      typeId: this.requireCatalogId(typeIds, question.type),
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


