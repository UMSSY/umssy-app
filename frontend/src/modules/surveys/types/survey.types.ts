import type { AcademicPeriod } from "@/modules/reports";

export type SurveyStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export interface SurveyCreator {
  fullName: string;
  email: string;
}

export interface SurveyListItem {
  id: string;
  title: string;
  creator: SurveyCreator;
  period: AcademicPeriod;
  createdAt: string;
  status: SurveyStatus;
}

export interface SurveysParams {
  page: number;
  limit: number;
  period?: AcademicPeriod;
  search?: string;
}
