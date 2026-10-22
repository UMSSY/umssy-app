import type { Career } from "@/modules/access-request";
import type { AcademicPeriod } from "@/modules/reports";

// Contrato de la API de encuestas: es la forma en que el backend enviará y recibirá los datos.

export type SurveyStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type SurveyQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "DROPDOWN";
// null significa que la encuesta va dirigida a todas las carreras.
export type SurveyTargetCareer = Career | null;

export interface SurveyCreator {
  fullName: string;
  email: string;
}

export interface SurveyListItem {
  id: string;
  title: string;
  creator: SurveyCreator;
  // Un borrador puede no tener gestión todavía.
  period: AcademicPeriod | null;
  createdAt: string;
  status: SurveyStatus;
}

export interface SurveysParams {
  page: number;
  limit: number;
  period?: AcademicPeriod;
  search?: string;
}

export interface SurveyQuestionInput {
  text: string;
  type: SurveyQuestionType;
  isRequired: boolean;
  options: string[];
}

// Cuerpo de POST /surveys y PUT /surveys/:id.
export interface SurveyInput {
  title: string;
  description: string;
  targetCareer: SurveyTargetCareer;
  period: AcademicPeriod | null;
  opensAt: string;
  closesAt: string;
  questions: SurveyQuestionInput[];
}

export interface SurveyDetail extends SurveyInput {
  id: string;
  status: SurveyStatus;
}

export interface SurveySummary {
  id: string;
  title: string;
  period: AcademicPeriod;
  targetCareer: SurveyTargetCareer;
  status: SurveyStatus;
}

// Respuesta de GET /surveys/:id/metrics (HU3).
export interface SurveyMetrics {
  invitedCount: number;
  respondedCount: number;
  completedCount: number;
  responseRate: number;
  completionRate: number;
  averageResponseSeconds: number;
  distinctCareers: number;
  distinctPeriods: number;
}

export interface SurveyOptionResult {
  id: string;
  text: string;
  count: number;
  percentage: number;
}

export interface SurveyQuestionResult {
  id: string;
  order: number;
  text: string;
  type: SurveyQuestionType;
  isRequired: boolean;
  answeredBy: number;
  totalSelections: number;
  options: SurveyOptionResult[];
}

// Respuesta de GET /surveys/:id/statistics (HU4).
export interface SurveyStatistics {
  survey: SurveySummary;
  totalResponses: number;
  questions: SurveyQuestionResult[];
}
