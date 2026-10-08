// REGISTERED_USERS es la exportación de usuarios registrados sin filtro de tipo.
export type ReportType =
  | "REGISTERED_USERS"
  | "STUDENTS"
  | "DEGREE_HOLDERS"
  | "MENTORS"
  | "COMPANIES"
  | "ADMINS"
  | "REJECTED_USERS";

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
}
