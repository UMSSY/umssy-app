"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AUDIT_PAGE_SIZE } from "../constants/audit-log.constants";
import { AUDIT_LOG_QUERY_KEYS } from "../constants/audit-log-query-keys.constants";
import { auditLogService } from "../services/audit-log.service";
import type { AuditLogFilters } from "../types/audit-log-filters.types";
import { AuditRequestError, unwrapAuditResult } from "../utils/audit-request-error";

export function useAuditEvents(filters: AuditLogFilters) {
  // Al cambiar los filtros se vuelve a la primera página
  const filterKey = JSON.stringify(filters);
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;

  const query = useQuery({
    queryKey: AUDIT_LOG_QUERY_KEYS.list(filters, page, AUDIT_PAGE_SIZE),
    queryFn: async () => unwrapAuditResult(await auditLogService.listEvents(page, filters)),
  });

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const error = query.error;
  const goToPage = (target: number) => setPageState({ key: filterKey, page: Math.min(totalPages, Math.max(1, target)) });

  return {
    items: query.data?.items ?? [],
    total,
    page,
    totalPages,
    from: total === 0 ? 0 : (page - 1) * AUDIT_PAGE_SIZE + 1,
    to: Math.min(page * AUDIT_PAGE_SIZE, total),
    hasPrevious: page > 1,
    hasNext: page < totalPages,
    goToPage,
    goToPrevious: () => goToPage(page - 1),
    goToNext: () => goToPage(page + 1),
    isLoading: query.isPending,
    error: error ? error.message : null,
    errorStatus: error instanceof AuditRequestError ? error.status : null,
    retry: () => void query.refetch(),
  };
}
