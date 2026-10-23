import type { Prisma } from '../../../prisma/client.js';
import type { CAREER_SELECT } from '../constants/survey.constants.js';
import type { SurveyStatus } from './survey.enum.js';

export interface SurveyCreatedRecord {
  id: string;
  title: string;
  status: SurveyStatus;
  createdAt: Date;
}

export interface SurveySummaryRecord extends SurveyCreatedRecord {
  academicPeriod: string | null;
  opensAt: Date | null;
  closesAt: Date | null;
  career: { id: string; title: string } | null;
  _count: { questions: number };
}

export type CareerRecord = Prisma.CareerGetPayload<{
  select: typeof CAREER_SELECT;
}>;

export interface SurveyTitleScope {
  title: string;
  careerId: string | null;
  academicPeriod: string | null;
}
