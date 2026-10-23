import { Injectable } from '@nestjs/common';
import { SurveyQuestionType, SurveyStatus } from '../../../prisma/enums.js';
import type { CreateSurveyRequest } from '../requests/create-survey.schema.js';
import type { CareerResponse } from '../responses/career.response.js';
import type { SurveyCreatedResponse } from '../responses/survey-created.response.js';
import type { SurveySummaryResponse } from '../responses/survey-summary.response.js';
import type { CreateSurveyData } from '../types/create-survey-data.type.js';
import type {
  CareerRecord,
  SurveyCreatedRecord,
  SurveySummaryRecord,
} from '../types/survey-record.type.js';
import type {
  SurveyQuestionTypeValue,
  SurveyStatusValue,
} from '../types/survey.enum.js';

const STATUS_TO_RECORD: Record<SurveyStatusValue, SurveyStatus> = {
  draft: SurveyStatus.DRAFT,
  published: SurveyStatus.PUBLISHED,
};

const STATUS_TO_RESPONSE: Record<SurveyStatus, SurveyStatusValue> = {
  [SurveyStatus.DRAFT]: 'draft',
  [SurveyStatus.PUBLISHED]: 'published',
};

const QUESTION_TYPE_TO_RECORD: Record<SurveyQuestionTypeValue, SurveyQuestionType> = {
  single_choice: SurveyQuestionType.SINGLE_CHOICE,
  multiple_choice: SurveyQuestionType.MULTIPLE_CHOICE,
};

@Injectable()
export class SurveyMapper {
  toCreateData(request: CreateSurveyRequest, createdById: string): CreateSurveyData {
    return {
      title: request.title,
      description: request.description ?? null,
      careerId: request.careerId ?? null,
      academicPeriod: request.academicPeriod ?? null,
      opensAt: request.opensAt ? new Date(request.opensAt) : null,
      closesAt: request.closesAt ? new Date(request.closesAt) : null,
      status: STATUS_TO_RECORD[request.status],
      createdById,
      questions: (request.questions ?? []).map((question) => ({
        statement: question.statement,
        type: QUESTION_TYPE_TO_RECORD[question.type],
        isRequired: question.isRequired,
        options: (question.options ?? []).map(({ label }) => ({ label })),
      })),
    };
  }

  toCreatedResponse(record: SurveyCreatedRecord): SurveyCreatedResponse {
    return {
      id: record.id,
      title: record.title,
      status: STATUS_TO_RESPONSE[record.status],
      createdAt: record.createdAt.toISOString(),
    };
  }

  toSummaryResponse(record: SurveySummaryRecord): SurveySummaryResponse {
    return {
      id: record.id,
      title: record.title,
      status: STATUS_TO_RESPONSE[record.status],
      career: record.career ? this.toCareerResponse(record.career) : null,
      academicPeriod: record.academicPeriod,
      opensAt: record.opensAt?.toISOString() ?? null,
      closesAt: record.closesAt?.toISOString() ?? null,
      questionCount: record._count.questions,
      createdAt: record.createdAt.toISOString(),
    };
  }

  toCareerResponse(record: CareerRecord): CareerResponse {
    return { id: record.id, title: record.title };
  }
}
