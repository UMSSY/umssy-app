"use client";

import { useState } from "react";
import { PageBreadcrumb, type BreadcrumbEntry } from "@/shared/components/layout";
import { ExportErrorMessage } from "../components/export-error-message";
import { ExportSuccessToast } from "../components/export-success-toast";
import { RegisteredUsersTable } from "../components/registered-users-table";
import { ReportActions } from "../components/report-actions";
import { ReportAlertToast } from "../components/report-alert-toast";
import { ReportTableFooter } from "../components/report-table-footer";
import { UserTypeFilter } from "../components/user-type-filter";
import { useExportRegisteredUsersCsv } from "../hooks/use-export-registered-users-csv";
import { useRegisteredUsers } from "../hooks/use-registered-users";
import type { AcademicPeriod, UserType } from "../types/registered-user.types";

const BREADCRUMB_ITEMS: BreadcrumbEntry[] = [
  { label: "Inicio", href: "/dashboard" },
  { label: "Reportes Analíticos" },
  { label: "Reporte de usuarios registrados" },
];

const SLOW_REQUEST_MESSAGE = "Error 408: La solicitud está tardando demasiado";
const CONNECTION_ERROR_MESSAGE = "Error 503/504: Sin conexión con el servidor";

export function RegisteredUsersReportView() {
  const [currentPage, setCurrentPage] = useState(1);
  const [userType, setUserType] = useState<UserType | undefined>(undefined);
  const [period, setPeriod] = useState<AcademicPeriod | undefined>(undefined);
  const { users, totalItems, totalPages, isLoading, errorMessage, isSlow, hasConnectionError, refresh } =
    useRegisteredUsers(currentPage, userType, period);
  const {
    exportCsv,
    isExporting,
    errorMessage: exportErrorMessage,
    successMessage: exportSuccessMessage,
  } = useExportRegisteredUsersCsv(userType, period);

  // Cada filtro conserva el otro y vuelve a la página 1; elegir la opción ya activa no hace nada.
  const handleUserTypeChange = (selectedUserType?: UserType) => {
    if (selectedUserType === userType) return;
    setUserType(selectedUserType);
    setCurrentPage(1);
  };

  const handlePeriodChange = (selectedPeriod?: AcademicPeriod) => {
    if (selectedPeriod === period) return;
    setPeriod(selectedPeriod);
    setCurrentPage(1);
  };

  return (
    <section className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <PageBreadcrumb items={BREADCRUMB_ITEMS} />
        <h1 className="font-tight text-3xl font-extrabold text-ink">Reporte de usuarios registrados</h1>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <UserTypeFilter value={userType} onChange={handleUserTypeChange} />
        <ReportActions
          onExport={exportCsv}
          isExporting={isExporting}
          period={period}
          onPeriodChange={handlePeriodChange}
        />
      </div>

      <RegisteredUsersTable users={users} isLoading={isLoading} errorMessage={errorMessage} />

      <ExportErrorMessage message={exportErrorMessage} />
      <ExportSuccessToast message={exportSuccessMessage} />
      <ReportAlertToast variant="warning" message={isSlow ? SLOW_REQUEST_MESSAGE : undefined} />
      <ReportAlertToast variant="error" message={hasConnectionError ? CONNECTION_ERROR_MESSAGE : undefined} />

      <ReportTableFooter
        currentPage={currentPage}
        totalItems={totalItems}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={setCurrentPage}
        onRefresh={refresh}
      />
    </section>
  );
}