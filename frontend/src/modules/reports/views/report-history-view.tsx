"use client";

import { useState } from "react";
import { PageBreadcrumb, type BreadcrumbEntry } from "@/shared/components/layout";
import { ReportHistoryTable } from "../components/report-history-table";
import { ReportTypeFilter } from "../components/report-type-filter";
import { TablePagination } from "../components/table-pagination";
import { useReportHistory } from "../hooks/use-report-history";
import type { ReportType } from "../types/generated-report.types";

const BREADCRUMB_ITEMS: BreadcrumbEntry[] = [
  { label: "Inicio", href: "/dashboard" },
  { label: "Reportes Analíticos" },
  { label: "Historial de reportes generados" },
];

export function ReportHistoryView() {
  const [currentPage, setCurrentPage] = useState(1);
  const [reportType, setReportType] = useState<ReportType | undefined>(undefined);
  const { reports, totalPages, isLoading, errorMessage } = useReportHistory(currentPage, reportType);

  // Al cambiar el filtro se vuelve a la primera página de los resultados.
  const handleReportTypeChange = (selectedReportType?: ReportType) => {
    setReportType(selectedReportType);
    setCurrentPage(1);
  };

  return (
    <section className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <PageBreadcrumb items={BREADCRUMB_ITEMS} />
        <h1 className="font-tight text-3xl font-extrabold text-ink">Historial de Reportes Generados</h1>
      </header>

      <ReportTypeFilter value={reportType} onChange={handleReportTypeChange} />

      <ReportHistoryTable
        reports={reports}
        isLoading={isLoading}
        errorMessage={errorMessage}
        emptyMessage={reportType ? "No hay reportes generados de este tipo." : undefined}
      />

      <div className="mt-auto flex justify-end">
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </section>
  );
}
