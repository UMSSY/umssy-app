"use client";

import { useState } from "react";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { REPORT_HISTORY_EMPTY_TYPE_MESSAGE } from "../constants/generated-report.constants";
import {
  FILE_NAME_SEARCH_LABEL,
  REPORT_HISTORY_PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
} from "../constants/reports.constants";
import { ReportHistoryTable } from "../components/report-history-table";
import { ReportSearchInput } from "../components/report-search-input";
import { ReportTableFooter } from "../components/report-table-footer";
import { ReportTypeFilter } from "../components/report-type-filter";
import { useReportHistory } from "../hooks/use-report-history";
import type { ReportType } from "../types/generated-report.types";

export function ReportHistoryView() {
  const [currentPage, setCurrentPage] = useState(1);
  const [reportType, setReportType] = useState<ReportType | undefined>(undefined);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const { reports, totalItems, totalPages, isLoading, errorMessage, refresh } = useReportHistory(
    currentPage,
    reportType,
    search,
  );

  const handleReportTypeChange = (selectedReportType?: ReportType) => {
    setReportType(selectedReportType);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    if (value.trim() !== searchInput.trim()) {
      setCurrentPage(1);
    }
    setSearchInput(value);
  };

  return (
    <WorkspacePage title="Historial de reportes" description="Revisa los reportes generados y filtra por tipo de exportación.">

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center">
        <ReportTypeFilter value={reportType} onChange={handleReportTypeChange} />
        <ReportSearchInput value={searchInput} onChange={handleSearchChange} label={FILE_NAME_SEARCH_LABEL} />
      </div>

      <ReportHistoryTable
        reports={reports}
        isLoading={isLoading}
        errorMessage={errorMessage}
        emptyMessage={reportType ? REPORT_HISTORY_EMPTY_TYPE_MESSAGE : undefined}
        searchTerm={search}
      />

      <ReportTableFooter
        currentPage={currentPage}
        pageSize={REPORT_HISTORY_PAGE_SIZE}
        totalItems={totalItems}
        totalPages={totalPages}
        isLoading={isLoading}
        itemLabel="reportes"
        onPageChange={setCurrentPage}
        onRefresh={refresh}
      />
    </WorkspacePage>
  );
}
