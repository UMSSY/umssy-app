import type { AuditLogFilters } from "../types/audit-log-filters.types";

const ROOT = ["audit-log"] as const;

export const AUDIT_LOG_QUERY_KEYS = {
  all: ROOT,
  list: (filters: AuditLogFilters, page: number, limit: number) => [...ROOT, "list", filters, page, limit] as const,
  responsibles: [...ROOT, "responsibles"] as const,
};
