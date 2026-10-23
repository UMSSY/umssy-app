import type { SurveyMetricCardContent } from "../types/survey-report.types";
import type { SurveyMetrics } from "../types/survey.types";
import { formatAverageTime, formatCompletionRate, formatResponseRate } from "./format-survey-metrics";

export const EMPTY_SURVEY_METRICS: SurveyMetrics = {
  invitedCount: 0,
  respondedCount: 0,
  completedCount: 0,
  responseRate: 0,
  completionRate: 0,
  averageResponseSeconds: 0,
  distinctCareers: 0,
  distinctPeriods: 0,
};

// Textos de las cuatro tarjetas de la HU3. Los usan la pantalla y el PDF, así ambos muestran lo mismo.
export function buildMetricCards(metrics: SurveyMetrics = EMPTY_SURVEY_METRICS): SurveyMetricCardContent[] {
  return [
    {
      title: "Total de participación",
      value: String(metrics.respondedCount),
      description: `de un total de ${metrics.invitedCount} usuarios invitados / ${formatResponseRate(metrics.responseRate)} de respuesta`,
    },
    {
      title: "Tasa de finalización",
      value: formatCompletionRate(metrics.completionRate),
      description: `${metrics.completedCount} usuarios completaron todas las preguntas`,
    },
    {
      title: "Tiempo promedio de respuesta",
      value: formatAverageTime(metrics.averageResponseSeconds),
      description: "Promedio de tiempo por encuestado",
    },
    {
      title: "Diversidad de perfiles",
      value: String(metrics.distinctCareers + metrics.distinctPeriods),
      description: `${metrics.distinctCareers} carreras y ${metrics.distinctPeriods} gestiones de titulación identificadas`,
    },
  ];
}
