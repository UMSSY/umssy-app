import type { ExportedFile } from "@/modules/reports";
import type { ApiResponse, PaginatedData } from "@/shared/types/api-response.types";
import { formatDateTime } from "@/shared/utils/date.utils";
import {
  SURVEY_HISTORY_CSV_FALLBACK_NAME,
  SURVEY_HISTORY_CSV_HEADERS,
  SURVEY_HISTORY_MOCK_DELAY_MS,
  SURVEY_HISTORY_STATUS_LABELS,
} from "../constants/survey-history.constants";
import { SURVEY_HISTORY_MOCK } from "../mocks/survey-history.mock";
import type {
  SurveyHistoryExportParams,
  SurveyHistoryItem,
  SurveyHistoryParams,
} from "../types/survey-history.types";

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function filterSurveys({ academicPeriod, search }: SurveyHistoryExportParams): SurveyHistoryItem[] {
  const normalizedSearch = search?.trim().toLowerCase() ?? "";

  return SURVEY_HISTORY_MOCK.filter(
    (survey) =>
      survey.academicPeriod === academicPeriod &&
      (!normalizedSearch || survey.creator.email.toLowerCase().includes(normalizedSearch)),
  );
}

function toCsvValue(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function toCsv(surveys: SurveyHistoryItem[]): string {
  const rows = surveys.map((survey) => [
    survey.title,
    survey.creator.fullName,
    survey.creator.email,
    survey.academicPeriod,
    formatDateTime(survey.createdAt),
    SURVEY_HISTORY_STATUS_LABELS[survey.status],
  ]);

  return [SURVEY_HISTORY_CSV_HEADERS, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\r\n");
}

// Implementación con datos mockeados: reemplazar por llamadas a apiClient cuando exista el endpoint.
export const surveyHistoryService = {
  async getSurveyHistory({
    page,
    limit,
    ...filters
  }: SurveyHistoryParams): Promise<ApiResponse<PaginatedData<SurveyHistoryItem>>> {
    await wait(SURVEY_HISTORY_MOCK_DELAY_MS);
    const surveys = filterSurveys(filters);
    const offset = (page - 1) * limit;

    return {
      statusCode: 200,
      ok: true,
      detail: "Historial de encuestas obtenido correctamente",
      data: { items: surveys.slice(offset, offset + limit), totalItems: surveys.length },
      page,
    };
  },

  async exportSurveyHistoryCsv(params: SurveyHistoryExportParams): Promise<ExportedFile> {
    await wait(SURVEY_HISTORY_MOCK_DELAY_MS);
    const csv = toCsv(filterSurveys(params));

    return {
      file: new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }),
      fileName: SURVEY_HISTORY_CSV_FALLBACK_NAME,
    };
  },
};
