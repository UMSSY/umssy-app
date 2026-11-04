"use client";

import { useMemo, useState } from "react";
import { Mail } from "lucide-react";
import {
  type AcademicPeriod,
  ExportCsvButton,
  ExportSuccessToast,
  getAcademicPeriods,
  ReportFilterSelect,
  ReportSearchInput,
  SEARCH_DEBOUNCE_MS,
} from "@/modules/reports";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { SurveyHistoryDetailDialog } from "../components/survey-history-detail-dialog";
import { SurveyHistoryTable } from "../components/survey-history-table";
import { SurveyHistoryTableFooter } from "../components/survey-history-table-footer";
import {
  SURVEY_HISTORY_FILTERS_LABEL,
  SURVEY_HISTORY_ITEM_LABEL,
  SURVEY_HISTORY_PAGE_DESCRIPTION,
  SURVEY_HISTORY_PAGE_SIZE,
  SURVEY_HISTORY_PAGE_TITLE,
  SURVEY_HISTORY_PERIOD_LABEL,
  SURVEY_HISTORY_SEARCH_LABEL,
} from "../constants/survey-history.constants";
import { useExportSurveyHistoryCsv } from "../hooks/use-export-survey-history-csv";
import { useSurveyHistory } from "../hooks/use-survey-history";
import type { SurveyHistoryItem } from "../types/survey-history.types";

export function SurveyHistoryView() {
  const periodOptions = useMemo(() => getAcademicPeriods().map((value) => ({ value, label: value })), []);
  const [currentPage, setCurrentPage] = useState(1);
  // El historial siempre se segmenta por una gestión concreta; por defecto la más reciente.
  const [period, setPeriod] = useState<AcademicPeriod>(periodOptions[0].value);
  const [searchInput, setSearchInput] = useState("");
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyHistoryItem | null>(null);
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const { surveys, totalItems, totalPages, isLoading, errorMessage, refresh } = useSurveyHistory(
    currentPage,
    period,
    search,
  );
  const { exportCsv, isExporting, successMessage: exportSuccessMessage } = useExportSurveyHistoryCsv(period, search);

  const handleSearchChange = (value: string) => {
    if (value.trim() !== searchInput.trim()) {
      setCurrentPage(1);
    }
    setSearchInput(value);
  };

  const handlePeriodChange = (selectedPeriod?: AcademicPeriod) => {
    if (!selectedPeriod || selectedPeriod === period) return;
    setPeriod(selectedPeriod);
    setCurrentPage(1);
  };

  const handleDetailOpenChange = (open: boolean) => {
    if (!open) setSelectedSurvey(null);
  };

  return (
    <WorkspacePage title={SURVEY_HISTORY_PAGE_TITLE} description={SURVEY_HISTORY_PAGE_DESCRIPTION}>
      <div
        role="search"
        aria-label={SURVEY_HISTORY_FILTERS_LABEL}
        className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface p-4"
      >
        <ReportSearchInput
          value={searchInput}
          onChange={handleSearchChange}
          label={SURVEY_HISTORY_SEARCH_LABEL}
          icon={Mail}
        />
        <ReportFilterSelect
          label={SURVEY_HISTORY_PERIOD_LABEL}
          options={periodOptions}
          value={period}
          onChange={handlePeriodChange}
        />
        <div className="sm:ml-auto">
          <ExportCsvButton onClick={exportCsv} isExporting={isExporting} />
        </div>
      </div>

      <SurveyHistoryTable
        surveys={surveys}
        isLoading={isLoading}
        errorMessage={errorMessage}
        searchTerm={search}
        onViewDetails={setSelectedSurvey}
      />

      <SurveyHistoryTableFooter
        currentPage={currentPage}
        pageSize={SURVEY_HISTORY_PAGE_SIZE}
        totalItems={totalItems}
        totalPages={totalPages}
        isLoading={isLoading}
        itemLabel={SURVEY_HISTORY_ITEM_LABEL}
        onPageChange={setCurrentPage}
        onRefresh={refresh}
      />

      <SurveyHistoryDetailDialog survey={selectedSurvey} onOpenChange={handleDetailOpenChange} />
      <ExportSuccessToast message={exportSuccessMessage} />
    </WorkspacePage>
  );
}
