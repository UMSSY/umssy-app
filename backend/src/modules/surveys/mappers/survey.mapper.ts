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
import { calculatePercentage } from '../utils/calculate-percentage.js';
import { resolveSurveyStatus } from '../utils/resolve-survey-status.js';
import {
  toSurveyQuestionTypeValue,
  toSurveyStatusValue,
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
      careerId: request.careerId ?? null,
      academicPeriod: request.academicPeriod ?? null,
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

  toSummaryResponse(record: SurveySummaryRecord, now: Date = new Date()): SurveySummaryResponse {
    return {
      id: record.id,
      title: record.title,
      status: resolveSurveyStatus(record.status.title, record.closesAt, now),
      career: record.career ? this.toCareerResponse(record.career) : null,
      createdBy: {
        fullName: `${record.createdBy.firstName} ${record.createdBy.lastName}`.trim(),
        email: record.createdBy.email,
      },
      academicPeriod: record.academicPeriod,
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

  toDetailResponse(record: SurveyDetailRecord, now: Date = new Date()): SurveyDetailResponse {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      status: resolveSurveyStatus(record.status.title, record.closesAt, now),
      career: record.career ? this.toCareerResponse(record.career) : null,
      academicPeriod: record.academicPeriod,
      opensAt: record.opensAt?.toISOString() ?? null,
      closesAt: record.closesAt?.toISOString() ?? null,
      questions: record.questions.map((question) => ({
        id: question.id,
        position: question.position,
        statement: question.statement,
        type: toSurveyQuestionTypeValue(question.type.title),
        isRequired: question.isRequired,
        options: question.options.map(({ id, position, label }) => ({ id, position, label })),
      })),
    };
  }

  toStatisticsResponse(record: SurveyStatisticsRecord, now: Date = new Date()): SurveyStatisticsResponse {
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
      questions: record.questions.map((question) =>
        this.toQuestionStatisticResponse(question, totalResponses),
      ),
    };
  }

  private toQuestionStatisticResponse(
    question: SurveyStatisticsRecord['questions'][number],
    totalResponses: number,
  ): SurveyQuestionStatisticResponse {
    const options = question.options.map((option) => ({
      id: option.id,
      label: option.label,
      count: option._count.answers,
      percentage: calculatePercentage(option._count.answers, totalResponses),
    }));

    return {
      id: question.id,
      position: question.position,
      statement: question.statement,
      type: toSurveyQuestionTypeValue(question.type.title),
      isRequired: question.isRequired,
      answeredCount: question._count.answers,
      totalSelections: options.reduce((total, option) => total + option.count, 0),
      options,
    };
  }
}
