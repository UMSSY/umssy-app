import type { SurveyStatusValue } from '../types/survey.enum.js';
import type { CareerResponse } from './career.response.js';

export interface SurveySummaryResponse {
  id: string;
  title: string;
  status: SurveyStatusValue;
  career: CareerResponse | null;
  academicPeriod: string | null;
  opensAt: string | null;
  closesAt: string | null;
  questionCount: number;
  createdAt: string;
}
