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
  createdAt: string;
}
