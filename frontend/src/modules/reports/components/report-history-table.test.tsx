import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { GeneratedReport, ReportType } from "../types/generated-report.types";
import { ReportHistoryTable } from "./report-history-table";

function buildReport(reportType: ReportType): GeneratedReport {
  return {
    id: reportType,
    fileName: `reporte-${reportType}.csv`,
    reportType,
    generatedAt: "2026-10-08T04:22:08.095Z",
  };
}

describe("ReportHistoryTable", () => {
  afterEach(() => {
    cleanup();
  });

  it.each<[ReportType, string]>([
    ["REGISTERED_USERS", "Lista de Usuarios"],
    ["STUDENTS", "Estudiantes"],
    ["DEGREE_HOLDERS", "Titulados"],
    ["MENTORS", "Mentores"],
    ["COMPANIES", "Empresas"],
    ["ADMINS", "Administradores"],
    ["REJECTED_USERS", "Rechazados"],
  ])("muestra el tipo %s como \"%s\"", (reportType, label) => {
    render(<ReportHistoryTable reports={[buildReport(reportType)]} isLoading={false} />);

    expect(screen.getByRole("cell", { name: label })).toBeDefined();
  });
});
