export const SURVEYS_QUERY_KEYS = {
  all: ["surveys"] as const,
  list: ["surveys", "list"] as const,
  careers: ["surveys", "careers"] as const,
  detail: (id: string) => ["surveys", "detail", id] as const,
  statistics: (id: string, period?: string) => ["surveys", "statistics", id, period ?? "ALL"] as const,
};
