"use client";

import { useState } from "react";
import { PageBreadcrumb, type BreadcrumbEntry } from "@/shared/components/layout";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { EmailSearchInput } from "../components/email-search-input";
import { ExportCsvButton } from "../components/export-csv-button";
import { ExportErrorMessage } from "../components/export-error-message";
import { ExportSuccessToast } from "../components/export-success-toast";
import { RejectedUsersTable } from "../components/rejected-users-table";
import { ReportTableFooter } from "../components/report-table-footer";
import { useExportRejectedUsersCsv } from "../hooks/use-export-rejected-users-csv";
import { useRejectedUsers } from "../hooks/use-rejected-users";

const BREADCRUMB_ITEMS: BreadcrumbEntry[] = [
  { label: "Inicio", href: "/dashboard" },
  { label: "Reportes Analíticos" },
  { label: "Reporte de usuarios rechazados" },
];

const SEARCH_DEBOUNCE_MS = 300;

export function RejectedUsersReportView() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const { users, totalItems, totalPages, isLoading, errorMessage, refresh } = useRejectedUsers(currentPage, search);
  const {
    exportCsv,
    isExporting,
    errorMessage: exportErrorMessage,
    successMessage: exportSuccessMessage,
  } = useExportRejectedUsersCsv(search);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setCurrentPage(1);
  };

  return (
    <section className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <PageBreadcrumb items={BREADCRUMB_ITEMS} />
        <h1 className="font-tight text-3xl font-extrabold uppercase text-ink">REPORTE DE USUARIOS RECHAZADOS</h1>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <EmailSearchInput value={searchInput} onChange={handleSearchChange} />
        <ExportCsvButton onClick={exportCsv} isExporting={isExporting} />
      </div>

      <RejectedUsersTable
        users={users}
        isLoading={isLoading}
        errorMessage={errorMessage}
        searchTerm={search}
      />

      <ExportErrorMessage message={exportErrorMessage} />
      <ExportSuccessToast message={exportSuccessMessage} />

      <ReportTableFooter
        currentPage={currentPage}
        totalItems={totalItems}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={setCurrentPage}
        onRefresh={refresh}
        refreshLabel="Actualizar"
      />
    </section>
  );
}
