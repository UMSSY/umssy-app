"use client";

import { useCallback } from "react";
import { reportsService } from "../services/reports.service";
import type { ReportType } from "../types/generated-report.types";
import { usePaginatedReport } from "./use-paginated-report";

const LOAD_ERROR_MESSAGE = "No se pudo cargar el historial de reportes.";

export function useReportHistory(page: number, reportType?: ReportType) {
  const fetchPage = useCallback(
    (requestedPage: number, limit: number) =>
      reportsService.getReportHistory({ page: requestedPage, limit, reportType }),
    [reportType],
  );
  const { items, totalPages, isLoading, errorMessage } = usePaginatedReport(fetchPage, page, LOAD_ERROR_MESSAGE);

  return { reports: items, totalPages, isLoading, errorMessage };
}
