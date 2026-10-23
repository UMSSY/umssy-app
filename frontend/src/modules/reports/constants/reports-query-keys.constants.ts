import type { AcademicPeriod } from "../types/registered-user.types";

export const REPORTS_QUERY_KEYS = {
  all: ["reports"] as const,
  rejectedUsers: (page: number, period: AcademicPeriod | undefined, search: string) =>
    ["reports", "rejected-users", page, period ?? "ALL", search] as const,
};
