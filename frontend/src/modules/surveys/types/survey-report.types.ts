import type { SurveyMetrics, SurveyStatistics } from "./survey.types";

export interface SurveyMetricCardContent {
  title: string;
  value: string;
  description: string;
}

// Datos que se exportan al PDF: los mismos que muestra la pantalla de analíticas.
export interface SurveyReportData {
  statistics: SurveyStatistics;
  metrics: SurveyMetrics;
  generatedAt: string;
}

export interface SurveyReportDocumentProps {
  report: SurveyReportData;
}
