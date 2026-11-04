import type { AcademicPeriod } from "@/modules/reports";
import type { PaginatedData } from "@/shared/types/api-response.types";

export type SurveyHistoryStatus = "active" | "inactive";

export interface SurveyCreator {
  id: string;
  fullName: string;
  email: string;
}

export interface SurveyHistoryItem {
  id: string;
  title: string;
  description: string;
  creator: SurveyCreator;
  academicPeriod: AcademicPeriod;
  careerTitle: string | null;
  questionCount: number;
  responseCount: number;
  status: SurveyHistoryStatus;
  createdAt: string;
}

export interface SurveyHistoryParams {
  page: number;
  limit: number;
  academicPeriod: AcademicPeriod;
  search?: string;
}

export type SurveyHistoryExportParams = Pick<SurveyHistoryParams, "academicPeriod" | "search">;

export interface SurveyHistoryState {
  requestKey: string;
  result?: PaginatedData<SurveyHistoryItem>;
  errorMessage?: string;
}
