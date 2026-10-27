import type {
  SurveyQuestionTypeValue,
  SurveyDisplayStatusValue,
} from '../types/survey.enum.js';
import type { CareerResponse } from './career.response.js';

export interface SurveyDetailOptionResponse {
  id: string;
  position: number;
  label: string;
}

export interface SurveyDetailQuestionResponse {
  id: string;
  position: number;
  statement: string;
  type: SurveyQuestionTypeValue;
  isRequired: boolean;
  options: SurveyDetailOptionResponse[];
}

export interface SurveyDetailResponse {
  id: string;
  title: string;
  description: string | null;
  status: SurveyDisplayStatusValue;
  career?: CareerResponse | null;
  academicPeriod: string | null;
  opensAt: string | null;
  closesAt: string | null;
  hasAnswered?: boolean;
  isExpired?: boolean;
  questions: SurveyDetailQuestionResponse[];
}
