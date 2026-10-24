import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  CAREER_SELECT,
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
import type { GraduateProfile } from '../types/graduate-profile.type.js';
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
        status: 'PUBLISHED',
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
        questions: {
          orderBy: { position: 'asc' },
          include: {
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
      status: (survey.status === 'PUBLISHED' ? 'published' : 'draft') as 'published' | 'draft',
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
        type: (q.type === 'MULTIPLE_CHOICE' ? 'multiple_choice' : 'single_choice') as 'single_choice' | 'multiple_choice',
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


