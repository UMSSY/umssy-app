import { describe, expect, it } from "vitest";
import { buildReportPdfFilters, getAcademicPeriodStartDate } from "./report-pdf-filters.util";

describe("buildReportPdfFilters", () => {
  it("usa valores por defecto cuando no hay filtros activos", () => {
    expect(buildReportPdfFilters("Aprobados desde")).toEqual([
      { label: "Tipo de usuario", value: "Todos" },
      { label: "Aprobados desde", value: "Todas las fechas" },
      { label: "Búsqueda", value: "ninguna" },
    ]);
  });

  it("describe los filtros activos del reporte", () => {
    expect(buildReportPdfFilters("Rechazados desde", "estudiante", "II-2026", "  ana  ")).toEqual([
      { label: "Tipo de usuario", value: "Estudiante" },
      { label: "Rechazados desde", value: "01/07/2026" },
      { label: "Búsqueda", value: '"ana"' },
    ]);
  });

  it("calcula el inicio de cada semestre académico", () => {
    expect(getAcademicPeriodStartDate("I-2025")).toBe("01/01/2025");
    expect(getAcademicPeriodStartDate("II-2025")).toBe("01/07/2025");
  });
});
