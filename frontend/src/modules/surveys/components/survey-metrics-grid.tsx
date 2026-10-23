import type { SurveyMetrics } from "../types/survey.types";
import type { SurveyMetricsGridProps } from "../types/survey-metrics-grid-props.types";
import {
  formatAverageTime,
  formatCompletionRate,
  formatResponseRate,
} from "../utils/format-survey-metrics";
import { SurveyMetricCard } from "./survey-metric-card";

const EMPTY_METRICS: SurveyMetrics = {
  invitedCount: 0,
  respondedCount: 0,
  completedCount: 0,
  responseRate: 0,
  completionRate: 0,
  averageResponseSeconds: 0,
  distinctCareers: 0,
  distinctPeriods: 0,
};

// Las cuatro tarjetas de la HU3. Sin datos muestran ceros (0, 0% y 0:00 min).
export function SurveyMetricsGrid({ metrics, isLoading }: SurveyMetricsGridProps) {
  const data = metrics ?? EMPTY_METRICS;
  const cards = [
    {
      title: "Total de participación",
      value: String(data.respondedCount),
      description: `de un total de ${data.invitedCount} usuarios invitados / ${formatResponseRate(data.responseRate)} de respuesta`,
    },
    {
      title: "Tasa de finalización",
      value: formatCompletionRate(data.completionRate),
      description: `${data.completedCount} usuarios completaron todas las preguntas`,
    },
    {
      title: "Tiempo promedio de respuesta",
      value: formatAverageTime(data.averageResponseSeconds),
      description: "Promedio de tiempo por encuestado",
    },
    {
      title: "Diversidad de perfiles",
      value: String(data.distinctCareers + data.distinctPeriods),
      description: `${data.distinctCareers} carreras y ${data.distinctPeriods} gestiones de titulación identificadas`,
    },
  ];

  return (
    <section aria-label="Métricas de participación" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SurveyMetricCard key={card.title} {...card} isLoading={isLoading} />
      ))}
    </section>
  );
}
