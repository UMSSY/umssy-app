import type { SurveyQuestionType, SurveyStatus } from './survey.enum.js';

export interface CreateSurveyOptionData {
  label: string;
}

export interface CreateSurveyQuestionData {
  statement: string;
  type: SurveyQuestionType;
  isRequired: boolean;
  options: CreateSurveyOptionData[];
}

export interface CreateSurveyData {
  title: string;
  description: string | null;
  careerId: string | null;
  academicPeriod: string | null;
  opensAt: Date | null;
  closesAt: Date | null;
  status: SurveyStatus;
  createdById: string;
  questions: CreateSurveyQuestionData[];
}
