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
  // Indicador de "sin datos": false cuando el periodo consultado no tiene respuestas; la estructura se conserva.
  hasData: boolean;
  // Semestre consultado (I-2026 / II-2026) o null si se consultan todas las respuestas.
  period: string | null;
  // Semestres que se pueden consultar: desde la apertura de la encuesta hasta hoy o su cierre.
  availablePeriods: string[];
  questions: SurveyQuestionStatisticResponse[];
}
