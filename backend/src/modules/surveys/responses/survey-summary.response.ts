import type { SurveyDisplayStatusValue } from '../types/survey.enum.js';
import type { CareerResponse } from './career.response.js';

export interface SurveyCreatorResponse {
  fullName: string;
  email: string;
}

export interface SurveySummaryResponse {
  id: string;
  title: string;
  status: SurveyDisplayStatusValue;
  career: CareerResponse | null;
  createdBy: SurveyCreatorResponse;
  academicPeriod: string | null;
  opensAt: string | null;
  closesAt: string | null;
  questionCount: number;
  responseCount: number;
  createdAt: string;
}
