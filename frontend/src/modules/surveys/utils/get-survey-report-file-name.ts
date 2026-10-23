import { getTodayIsoDate } from "./validate-survey-input";

// Nombre del archivo: reporte-encuesta-<título sin acentos ni símbolos>-<fecha en Bolivia>.pdf
export function getSurveyReportFileName(title: string, generatedAt: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `reporte-encuesta-${slug || "sin-titulo"}-${getTodayIsoDate(new Date(generatedAt))}.pdf`;
}
