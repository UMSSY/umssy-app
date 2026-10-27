import type { Prisma } from '../../../prisma/client.js';
import type {
  CAREER_SELECT,
  SURVEY_DETAIL_INCLUDE,
  SURVEY_STATISTICS_INCLUDE,
} from '../constants/survey.constants.js';

export interface SurveyCreatedRecord {
  id: string;
  title: string;
  status: { title: string };
  createdAt: Date;
}

export interface SurveySummaryRecord extends SurveyCreatedRecord {
  academicPeriod: string | null;
  opensAt: Date | null;
  closesAt: Date | null;
  career: { id: string; title: string } | null;
  createdBy: { firstName: string; lastName: string; email: string };
  _count: { questions: number; responses: number };
}

export type CareerRecord = Prisma.CareerGetPayload<{
  select: typeof CAREER_SELECT;
}>;

export type SurveyDetailRecord = Prisma.SurveyGetPayload<{
  include: typeof SURVEY_DETAIL_INCLUDE;
}>;

export type SurveyStatisticsRecord = Prisma.SurveyGetPayload<{
  include: typeof SURVEY_STATISTICS_INCLUDE;
}>;

export interface SurveyTitleScope {
  title: string;
  careerId: string | null;
  academicPeriod: string | null;
  excludedId?: string;
}
