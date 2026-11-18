import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  EMPLOYMENT_STATUS_QUESTION,
  SURVEY_EMPLOYMENT_RESPONSE_SELECT,
} from '../constants/survey-employment.constants.js';
import type { SurveyEmploymentResponseFilter } from '../types/survey-employment-response-filter.type.js';
import type { SurveyEmploymentResponseRecord } from '../types/survey-employment-response-record.type.js';

@Injectable()
export class SurveyEmploymentResponsesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    filter: SurveyEmploymentResponseFilter,
  ): Promise<SurveyEmploymentResponseRecord[]> {
    return this.prisma.surveyResponse.findMany({
      where: {
        submittedAt:
          filter.from || filter.to
            ? { gte: filter.from, lte: filter.to }
            : undefined,
        answers: {
          some: { question: { statement: EMPLOYMENT_STATUS_QUESTION } },
        },
        respondent: {
          isActive: true,
          approvedAccessRequest: filter.careerId
            ? { is: { careerId: filter.careerId } }
            : { isNot: null },
        },
      },
      select: SURVEY_EMPLOYMENT_RESPONSE_SELECT,
    });
  }
}
