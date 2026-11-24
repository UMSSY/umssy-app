import type { ReportType } from "./report-type.types";

export interface ReportHistoryParams {
  page: number;
  limit: number;
  reportType?: ReportType;
  search?: string;
  snapshotAt?: string;
}
