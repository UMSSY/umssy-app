import type { RejectedUsersParams } from "./rejected-users-params.types";
import type { ReportExportFormat } from "./report-export-format.types";

export type RejectedUsersExportParams = Pick<RejectedUsersParams, "userType" | "period" | "search"> &
  Partial<Pick<RejectedUsersParams, "page" | "limit" | "snapshotAt">> & { format?: ReportExportFormat };
