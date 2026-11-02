"use client";

import { useQuery } from "@tanstack/react-query";
import { AUDIT_LOG_QUERY_KEYS } from "../constants/audit-log-query-keys.constants";
import { auditLogRecordsService } from "../services/audit-log-records.service";
import { unwrapAuditResult } from "../utils/audit-request-error";

// Responsables del catálogo del servidor; nunca una lista fija
export function useAuditResponsibles() {
  const query = useQuery({
    queryKey: AUDIT_LOG_QUERY_KEYS.responsibles,
    queryFn: async () => unwrapAuditResult(await auditLogRecordsService.listResponsibles()),
  });
  return query.data ?? [];
}
