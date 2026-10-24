import type { AcademicPeriod } from "@/modules/reports";

export type SurveyStatus = "draft" | "published";

export type QuestionType = "single_choice" | "multiple_choice";

export interface Career {
  id: string;
  title: string;
}

export interface CreateSurveyOptionPayload {
  label: string;
}

export interface CreateSurveyQuestionPayload {
  statement: string;
  type: QuestionType;
  isRequired: boolean;
  options: CreateSurveyOptionPayload[];
}

export interface CreateSurveyPayload {
  title: string;
  description?: string;
  careerId?: string;
  academicPeriod?: AcademicPeriod;
  opensAt?: string;
  closesAt?: string;
  status: SurveyStatus;
  questions: CreateSurveyQuestionPayload[];
}

export interface CreatedSurvey {
  id: string;
  title: string;
  status: SurveyStatus;
  createdAt: string;
}

export interface SurveySummary {
  id: string;
  title: string;
  status: SurveyStatus;
  career: Career | null;
  academicPeriod: string | null;
  opensAt: string | null;
  closesAt: string | null;
  questionCount: number;
  responseCount?: number;
  createdAt: string;
}

export interface SurveyOptionStatistic {
  id: string;
  label: string;
  count: number;
  percentage: number;
}

export interface SurveyQuestionStatistic {
  id: string;
  position: number;
  statement: string;
  type: QuestionType;
  isRequired: boolean;
  answeredCount: number;
  totalSelections: number;
  options: SurveyOptionStatistic[];
}

export interface SurveyStatistics {
  id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  academicPeriod: string | null;
  career: Career | null;
  opensAt: string | null;
  closesAt: string | null;
  totalResponses: number;
  questions: SurveyQuestionStatistic[];
}


export interface SurveyDetailOption {
  id: string;
  position: number;
  label: string;
}

export interface SurveyDetailQuestion {
  id: string;
  position: number;
  statement: string;
  type: QuestionType;
  isRequired: boolean;
  options: SurveyDetailOption[];
}

export interface SurveyDetail {
  id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  career: Career | null;
  academicPeriod: string | null;
  opensAt: string | null;
  closesAt: string | null;
  questions: SurveyDetailQuestion[];
}
