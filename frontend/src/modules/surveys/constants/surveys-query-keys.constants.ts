import type { AcademicPeriod } from "@/modules/reports";

export const SURVEYS_QUERY_KEYS = {
  all: ["surveys"] as const,
  list: (page: number, pageSize: number, period: AcademicPeriod | undefined, search: string) =>
    ["surveys", "list", page, pageSize, period ?? "ALL", search] as const,
  detail: (id: string) => ["surveys", "detail", id] as const,
  metrics: (id: string) => ["surveys", "metrics", id] as const,
  statistics: (id: string) => ["surveys", "statistics", id] as const,
};
