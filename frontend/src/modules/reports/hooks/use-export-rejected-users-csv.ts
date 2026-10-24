"use client";

import { useCallback } from "react";
import { REJECTED_USERS_CSV_FALLBACK_NAME } from "../constants/reports.constants";
import { reportsService } from "../services/reports.service";
import type { AcademicPeriod } from "../types/registered-user.types";
import { useExportReportCsv } from "./use-export-report-csv";

export function useExportRejectedUsersCsv(period?: AcademicPeriod, search?: string) {
  const exportReport = useCallback(
    () => reportsService.exportRejectedUsersCsv({ period, search }),
    [period, search],
  );

  return useExportReportCsv(exportReport, REJECTED_USERS_CSV_FALLBACK_NAME);
}
