import type { RoleTag } from "@/modules/auth";
import type { AcademicPeriod } from "../types/registered-user.types";

export const REPORTS_QUERY_KEYS = {
  all: ["reports"] as const,
  rejectedUsers: (page: number, userType: RoleTag | undefined, period: AcademicPeriod | undefined, search: string) =>
    ["reports", "rejected-users", page, userType ?? "ALL", period ?? "ALL", search] as const,
};
