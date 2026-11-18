import type { PaginatedData } from "@/shared/types/api-response.types";
import type { GeneratedReport } from "./generated-report.types";

export interface ReportHistoryState {
  requestKey: string;
  result?: PaginatedData<GeneratedReport>;
  errorMessage?: string;
}
