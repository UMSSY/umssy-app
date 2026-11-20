import { Injectable } from '@nestjs/common';
import type { CreateSurveyRequest } from '../requests/create-survey.schema.js';
import type { CareerResponse } from '../responses/career.response.js';
import type { SurveyCreatedResponse } from '../responses/survey-created.response.js';
import type { SurveyDetailResponse } from '../responses/survey-detail.response.js';
import type {
  SurveyQuestionStatisticResponse,
  SurveyStatisticsResponse,
} from '../responses/survey-statistics.response.js';
import type { SurveySummaryResponse } from '../responses/survey-summary.response.js';
import type {
  CreateSurveyData,
  UpdateSurveyData,
} from '../types/create-survey-data.type.js';
import type {
  CareerRecord,
  SurveyCreatedRecord,
  SurveyDetailRecord,
  SurveyStatisticsRecord,
  SurveySummaryRecord,
} from '../types/survey-record.type.js';
import type {
  StatisticsContext,
  TrendComparison,
} from '../types/survey-statistics.type.js';
import { buildQuestionTrend } from '../utils/build-question-trend.js';
import { distributePercentages } from '../utils/distribute-percentages.js';
import { listSemesters } from '../utils/academic-semester.js';
import { resolveSurveyStatus } from '../utils/resolve-survey-status.js';
import { SURVEY_ALL_CAREERS } from '../constants/survey.constants.js';
import {
  toSurveyQuestionTypeValue,
  toSurveyStatusValue,
  toSurveyTargetAudienceValue,
} from '../utils/survey-catalog-values.js';

@Injectable()
export class SurveyMapper {
  toCreateData(
    request: CreateSurveyRequest,
    createdById: string,
  ): CreateSurveyData {
    return { ...this.toUpdateData(request), createdById };
  }

  toUpdateData(request: CreateSurveyRequest): UpdateSurveyData {
    return {
      title: request.title,
      description: request.description ?? null,
      careerId:
        request.careerId && request.careerId !== SURVEY_ALL_CAREERS
          ? request.careerId
          : null,
      targetsAllCareers: request.careerId === SURVEY_ALL_CAREERS,
      academicPeriod: request.academicPeriod ?? null,
      targetAudience: request.targetAudience ?? null,
      opensAt: request.opensAt ? new Date(request.opensAt) : null,
      closesAt: request.closesAt ? new Date(request.closesAt) : null,
      status: request.status,
      questions: (request.questions ?? []).map((question) => ({
        statement: question.statement,
        type: question.type,
        isRequired: question.isRequired,
        options: (question.options ?? []).map(({ label }) => ({ label })),
      })),
    };
  }

  toCreatedResponse(record: SurveyCreatedRecord): SurveyCreatedResponse {
    return {
      id: record.id,
      title: record.title,
      status: toSurveyStatusValue(record.status.title),
      createdAt: record.createdAt.toISOString(),
    };
  }

  toSummaryResponse(
    record: SurveySummaryRecord,
    now: Date = new Date(),
  ): SurveySummaryResponse {
    return {
      id: record.id,
      title: record.title,
      status: resolveSurveyStatus(record.status.title, record.closesAt, now),
      career: record.career ? this.toCareerResponse(record.career) : null,
      createdBy: {
        fullName:
          `${record.createdBy.firstName} ${record.createdBy.lastName}`.trim(),
        email: record.createdBy.email,
      },
      academicPeriod: record.academicPeriod,
      targetAudience: toSurveyTargetAudienceValue(record.targetAudience),
      opensAt: record.opensAt?.toISOString() ?? null,
      closesAt: record.closesAt?.toISOString() ?? null,
      questionCount: record._count.questions,
      responseCount: record._count.responses ?? 0,
      createdAt: record.createdAt.toISOString(),
    };
  }

  toCareerResponse(record: CareerRecord): CareerResponse {
    return { id: record.id, title: record.title };
  }

  toDetailResponse(
    record: SurveyDetailRecord,
    now: Date = new Date(),
  ): SurveyDetailResponse {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      status: resolveSurveyStatus(record.status.title, record.closesAt, now),
      career: record.career ? this.toCareerResponse(record.career) : null,
      targetsAllCareers: record.targetsAllCareers,
      academicPeriod: record.academicPeriod,
      targetAudience: toSurveyTargetAudienceValue(record.targetAudience),
      opensAt: record.opensAt?.toISOString() ?? null,
      closesAt: record.closesAt?.toISOString() ?? null,
      questions: record.questions.map((question) => ({
        id: question.id,
        position: question.position,
        statement: question.statement,
        type: toSurveyQuestionTypeValue(question.type.title),
        isRequired: question.isRequired,
        options: question.options.map(({ id, position, label }) => ({
          id,
          position,
          label,
        })),
      })),
    };
  }

  toStatisticsResponse(
    record: SurveyStatisticsRecord,
    now: Date = new Date(),
    { period = null, previous }: StatisticsContext = {},
  ): SurveyStatisticsResponse {
    const totalResponses = record._count.responses;

    return {
      id: record.id,
      title: record.title,
      description: record.description,
      status: resolveSurveyStatus(record.status.title, record.closesAt, now),
      academicPeriod: record.academicPeriod,
      career: record.career ? this.toCareerResponse(record.career) : null,
      opensAt: record.opensAt?.toISOString() ?? null,
      closesAt: record.closesAt?.toISOString() ?? null,
      totalResponses,
      hasData: totalResponses > 0,
      period,
      availablePeriods: this.getAvailablePeriods(record, now),
      questions: record.questions.map((question) =>
        this.toQuestionStatisticResponse(
          question,
          previous ? this.toTrendComparison(question.id, previous) : undefined,
        ),
      ),
    };
  }

  private getAvailablePeriods(
    record: SurveyStatisticsRecord,
    now: Date,
  ): string[] {
    const from = record.opensAt ?? record.createdAt;
    const closed =
      record.closesAt && record.closesAt < now ? record.closesAt : now;
    return listSemesters(from, closed < from ? from : closed);
  }

  private toTrendComparison(
    questionId: string,
    previous: StatisticsContext['previous'],
  ): TrendComparison | undefined {
    const question = previous?.record.questions.find(
      ({ id }) => id === questionId,
    );
    if (!previous || !question) return undefined;

    const counts = question.options.map((option) => option._count.answers);
    const percentages = distributePercentages(counts);
    const hasAnswers = counts.some((count) => count > 0);

    return {
      period: previous.period,
      percentageByOption: new Map(
        hasAnswers
          ? question.options.map((option, index) => [
              option.id,
              percentages[index],
            ])
          : [],
      ),
    };
  }

  private toQuestionStatisticResponse(
    question: SurveyStatisticsRecord['questions'][number],
    comparison?: TrendComparison,
  ): SurveyQuestionStatisticResponse {
    const counts = question.options.map((option) => option._count.answers);
    const totalSelections = counts.reduce((total, count) => total + count, 0);
    const percentages = distributePercentages(counts);
    const options = question.options.map((option, index) => ({
      id: option.id,
      label: option.label,
      count: counts[index],
      percentage: percentages[index],
    }));
    const type = toSurveyQuestionTypeValue(question.type.title);

    return {
      id: question.id,
      position: question.position,
      statement: question.statement,
      type,
      isRequired: question.isRequired,
      answeredCount: question._count.answers,
      totalSelections,
      options,
      trend: buildQuestionTrend({
        options,
        totalSelections,
        isMultipleChoice: type === 'multiple_choice',
        comparison,
      }),
    };
  }
}
