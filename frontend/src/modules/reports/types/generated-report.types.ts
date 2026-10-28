import type { PaginatedData } from "@/shared/types/api-response.types";

export type ReportType =
  | "REGISTERED_USERS"
  | "STUDENTS"
  | "DEGREE_HOLDERS"
  | "MENTORS"
  | "COMPANIES"
  | "ADMINS"
  | "REJECTED_USERS"
  | "SURVEY_STATISTICS";

export interface GeneratedReport {
  id: string;
  fileName: string;
  reportType: ReportType;
  generatedAt: string;
}

export interface ReportHistoryParams {
  page: number;
  limit: number;
  reportType?: ReportType;
  search?: string;
  snapshotAt?: string;
}

export interface ReportHistoryState {
  requestKey: string;
  result?: PaginatedData<GeneratedReport>;
  errorMessage?: string;
}
