"use client";

import React from "react";
import { UsersReportHeader } from "../components/common/users-report-header";
import { UsersReportPagination } from "../components/common/users-report-pagination";
import { UsersReportFilters } from "../components/users-report/users-report-filters";
import { UsersReportTable } from "../components/users-report/users-report-table";

export function AcceptedUsersReportView() {
  return (
    <div className="flex-1 bg-background p-4 sm:p-6 md:p-8 space-y-4 max-w-7xl mx-auto w-full">
      {/* Encabezado: Migas de pan y Título */}
      <UsersReportHeader />

      {/* Barra de Filtro y Acciones */}
      <UsersReportFilters />

      {/* Tabla con la información de usuarios aceptados */}
      <UsersReportTable />

      {/* Paginación y Botón Central de Actualizar */}
      <UsersReportPagination />
    </div>
  );
}
