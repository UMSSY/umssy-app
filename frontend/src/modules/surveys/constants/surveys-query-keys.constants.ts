import type { AcademicPeriod } from "@/modules/reports";

export const SURVEYS_QUERY_KEYS = {
  all: ["surveys"] as const,
  list: (page: number, period: AcademicPeriod | undefined, search: string) =>
    ["surveys", "list", page, period ?? "ALL", search] as const,
};
