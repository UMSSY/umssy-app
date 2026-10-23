import type { Prisma } from '../../../prisma/client.js';
import type {
  CAREER_SELECT,
  SURVEY_CREATED_SELECT,
  SURVEY_SUMMARY_SELECT,
} from '../constants/survey.constants.js';

export type SurveyCreatedRecord = Prisma.SurveyGetPayload<{
  select: typeof SURVEY_CREATED_SELECT;
}>;

export type SurveySummaryRecord = Prisma.SurveyGetPayload<{
  select: typeof SURVEY_SUMMARY_SELECT;
}>;

export type CareerRecord = Prisma.CareerGetPayload<{
  select: typeof CAREER_SELECT;
}>;

export interface SurveyTitleScope {
  title: string;
  careerId: string | null;
  academicPeriod: string | null;
}
