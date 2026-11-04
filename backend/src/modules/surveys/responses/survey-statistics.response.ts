import type { SurveyDisplayStatusValue } from '../types/survey.enum.js';
import type { CareerResponse } from './career.response.js';

export interface SurveyOptionStatisticResponse {
  id: string;
  label: string;
  count: number;
  percentage: number;
}

export type SurveyTrendDirection = 'up' | 'down' | 'neutral';

export interface SurveyQuestionTrendResponse {
  text: string;
  direction: SurveyTrendDirection;
}

export interface SurveyQuestionStatisticResponse {
  id: string;
  position: number;
  statement: string;
  type: string;
  isRequired: boolean;
  answeredCount: number;
  totalSelections: number;
  options: SurveyOptionStatisticResponse[];
  trend: SurveyQuestionTrendResponse;
}

export interface SurveyStatisticsResponse {
  id: string;
  title: string;
  description: string | null;
  status: SurveyDisplayStatusValue;
  academicPeriod: string | null;
  career: CareerResponse | null;
  opensAt: string | null;
  closesAt: string | null;
  totalResponses: number;
  hasData: boolean;
  period: string | null;
  availablePeriods: string[];
  questions: SurveyQuestionStatisticResponse[];
}
