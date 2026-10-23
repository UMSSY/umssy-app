import { createElement } from "react";
import type { SurveyReportData } from "../types/survey-report.types";

// La librería de PDF se descarga recién al exportar (carga diferida), así no pesa en la carga de la página.
export async function renderSurveyReportPdf(report: SurveyReportData): Promise<Blob> {
  const [{ pdf }, { SurveyReportDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("../components/survey-report-document"),
  ]);
  // SurveyReportDocument devuelve un <Document>; el tipo de pdf() espera el elemento Document directamente.
  const document = createElement(SurveyReportDocument, { report }) as unknown as Parameters<typeof pdf>[0];
  return pdf(document).toBlob();
}
