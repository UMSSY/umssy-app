import type { RegisteredUsersParams } from "./registered-users-params.types";
import type { ReportExportFormat } from "./report-export-format.types";

export type RegisteredUsersExportParams = Pick<RegisteredUsersParams, "userType" | "period" | "search"> &
  Partial<Pick<RegisteredUsersParams, "page" | "limit" | "snapshotAt">> & { format?: ReportExportFormat };
