import type { HeatmapSemester } from "../types/heatmap-filters.types";

export const BOLIVIA_UTC_OFFSET = "-04:00";
export const BOLIVIA_UTC_OFFSET_HOURS = -4;
export const HEATMAP_FIRST_YEAR = 2022;
export const HEATMAP_LAST_YEAR = Math.max(new Date().getFullYear(), HEATMAP_FIRST_YEAR);

export const HEATMAP_YEAR_OPTIONS = Array.from({ length: HEATMAP_LAST_YEAR - HEATMAP_FIRST_YEAR + 1 }, (_, index) => {
  const year = String(HEATMAP_FIRST_YEAR + index);
  return { value: year, label: year };
});

export const HEATMAP_MONTH_OPTIONS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
].map((label, index) => ({ value: String(index + 1), label }));

export const HEATMAP_SEMESTER_OPTIONS: { value: `${HeatmapSemester}`; label: string }[] = [
  { value: "1", label: "1er Semestre" },
  { value: "2", label: "2do Semestre" },
];

export const HEATMAP_SEMESTER_BOUNDS: Record<HeatmapSemester, { start: string; end: string }> = {
  1: { start: "01-01T00:00:00", end: "06-30T23:59:59" },
  2: { start: "07-01T00:00:00", end: "12-31T23:59:59" },
};

export const HEATMAP_FILTER_TEXT = {
  careerLabel: "Carrera",
  allCareers: "Todas las carreras",
  yearLabel: "Gestión",
  allYears: "Todas",
  yearOverridden: "Definida por el filtro de fecha",
  monthLabel: "Meses",
  allMonths: "Enero - Diciembre",
  dateRangeButton: "Filtrar por fecha",
  clearDateRange: "Quitar filtro de fecha",
  dialogTitle: "Filtrar Reporte por Gestión Académica",
  dialogDescription: "Elige el rango de semestres que quieres incluir en el reporte.",
  startSection: "Desde el inicio",
  endSection: "Hasta el presente",
  yearField: "Año",
  semesterField: "Semestre",
  cancel: "Cancelar",
  apply: "Aplicar Filtro",
  rangeError: "El inicio del rango debe ser anterior o igual al final.",
} as const;
