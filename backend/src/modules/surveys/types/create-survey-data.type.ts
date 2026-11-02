import type {
  SurveyQuestionType,
  SurveyStatus,
  SurveyTargetAudience,
} from './survey.enum.js';

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
  targetsAllCareers: boolean;
  academicPeriod: string | null;
  targetAudience: SurveyTargetAudience | null;
  opensAt: Date | null;
  closesAt: Date | null;
  status: SurveyStatus;
  createdById: string;
  questions: CreateSurveyQuestionData[];
}

export type UpdateSurveyData = Omit<CreateSurveyData, 'createdById'>;
