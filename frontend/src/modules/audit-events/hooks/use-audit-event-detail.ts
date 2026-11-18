"use client";

import { useQuery } from "@tanstack/react-query";
import { AUDIT_LOG_QUERY_KEYS } from "../constants/audit-log-query-keys.constants";
import { auditLogService } from "../services/audit-log.service";
import { unwrapAuditResult } from "../utils/audit-request-error";

export function useAuditEventDetail(eventId: string | null) {
  const query = useQuery({
    queryKey: AUDIT_LOG_QUERY_KEYS.detail(eventId ?? ""),
    queryFn: async () => unwrapAuditResult(await auditLogService.getEventDetail(eventId as string)),
    enabled: eventId !== null,
  });

  return {
    detail: query.data ?? null,
    isLoading: query.isPending,
    error: query.error ? query.error.message : null,
  };
}
