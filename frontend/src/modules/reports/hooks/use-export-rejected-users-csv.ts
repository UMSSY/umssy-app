"use client";

import { useCallback } from "react";
import { REJECTED_USERS_CSV_FALLBACK_NAME, REJECTED_USERS_PAGE_SIZE } from "../constants/reports.constants";
import { reportsService } from "../services/reports.service";
import type { AcademicPeriod } from "../types/registered-user.types";
import type { ReportExportFormat, ReportExportScope } from "../types/report-export.types";
import type { RoleTag } from "@/modules/auth";
import { useExportReportCsv } from "./use-export-report-csv";

export function useExportRejectedUsersCsv(
  userType?: RoleTag,
  period?: AcademicPeriod,
  search?: string,
  page = 1,
  limit = REJECTED_USERS_PAGE_SIZE,
  snapshotAt?: string,
) {
  const exportReport = useCallback(
    (scope: ReportExportScope, format: ReportExportFormat) => reportsService.exportRejectedUsersCsv({
      userType,
      period,
      search,
      format,
      ...(scope === "page" && { page, limit, ...(snapshotAt && { snapshotAt }) }),
    }),
    [userType, period, search, page, limit, snapshotAt],
  );

  return useExportReportCsv(exportReport, REJECTED_USERS_CSV_FALLBACK_NAME);
}
