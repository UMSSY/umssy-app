"use client";

import { useCallback } from "react";
import { type AcademicPeriod, useExportReportCsv } from "@/modules/reports";
import { SURVEY_HISTORY_CSV_FALLBACK_NAME } from "../constants/survey-history.constants";
import { surveyHistoryService } from "../services/survey-history.service";

export function useExportSurveyHistoryCsv(academicPeriod: AcademicPeriod, search = "") {
  const exportSurveyHistory = useCallback(
    () => surveyHistoryService.exportSurveyHistoryCsv({ academicPeriod, search }),
    [academicPeriod, search],
  );

  return useExportReportCsv(exportSurveyHistory, SURVEY_HISTORY_CSV_FALLBACK_NAME);
}
