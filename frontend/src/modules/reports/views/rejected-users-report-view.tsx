"use client";

import { useState } from "react";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import {
  EMAIL_SEARCH_LABEL,
  REJECTED_USERS_PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
} from "../constants/reports.constants";
import { ExportSuccessToast } from "../components/export-success-toast";
import { RefreshButton } from "../components/refresh-button";
import { RejectedUsersTable } from "../components/rejected-users-table";
import { ReportActions } from "../components/report-actions";
import { ReportSearchInput } from "../components/report-search-input";
import { TablePagination } from "../components/table-pagination";
import { useExportRejectedUsersCsv } from "../hooks/use-export-rejected-users-csv";
import { useRejectedUsers } from "../hooks/use-rejected-users";
import type { AcademicPeriod } from "../types/registered-user.types";

export function RejectedUsersReportView() {
  const [currentPage, setCurrentPage] = useState(1);
  const [period, setPeriod] = useState<AcademicPeriod | undefined>(undefined);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const { users, totalItems, totalPages, isLoading, errorMessage, refresh } = useRejectedUsers(
    currentPage,
    period,
    search,
  );
  const {
    exportCsv,
    isExporting,
    successMessage: exportSuccessMessage,
  } = useExportRejectedUsersCsv(period, search);

  const handleSearchChange = (value: string) => {
    if (value.trim() !== searchInput.trim()) {
      setCurrentPage(1);
    }
    setSearchInput(value);
  };

  const handlePeriodChange = (selectedPeriod?: AcademicPeriod) => {
    if (selectedPeriod === period) return;
    setPeriod(selectedPeriod);
    setCurrentPage(1);
  };

  const firstVisibleItem = totalItems === 0 ? 0 : (currentPage - 1) * REJECTED_USERS_PAGE_SIZE + 1;
  const lastVisibleItem = Math.min(currentPage * REJECTED_USERS_PAGE_SIZE, totalItems);
  const hideSummary = Boolean(search) && !errorMessage && !isLoading && totalItems === 0;
  const showPagination = !errorMessage && totalItems > 0;

  return (
    <WorkspacePage title="Usuarios rechazados" description="Consulta los motivos de rechazo y exporta el listado filtrado.">

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4">
        <ReportSearchInput value={searchInput} onChange={handleSearchChange} label={EMAIL_SEARCH_LABEL} />
        <ReportActions onExport={exportCsv} isExporting={isExporting} period={period} onPeriodChange={handlePeriodChange} />
      </div>

      <RejectedUsersTable
        users={users}
        isLoading={isLoading}
        errorMessage={errorMessage}
        searchTerm={search}
      />

      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
        <p className="text-center text-sm text-text-secondary md:text-left">
          {!hideSummary &&
            (isLoading ? "Cargando usuarios..." : `Mostrando ${firstVisibleItem}-${lastVisibleItem} de ${totalItems} usuarios`)}
        </p>
        <div className="flex justify-center">
          <RefreshButton onClick={refresh} isRefreshing={isLoading} />
        </div>
        <div className="flex justify-center md:justify-end">
          {showPagination && (
            <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </div>
      </div>

      <ExportSuccessToast message={exportSuccessMessage} />
    </WorkspacePage>
  );
}
