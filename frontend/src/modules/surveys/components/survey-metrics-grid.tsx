import type { SurveyMetricsGridProps } from "../types/survey-metrics-grid-props.types";
import { buildMetricCards } from "../utils/build-metric-cards";
import { SurveyMetricCard } from "./survey-metric-card";

// Las cuatro tarjetas de la HU3. Sin datos muestran ceros (0, 0% y 0:00 min).
export function SurveyMetricsGrid({ metrics, isLoading }: SurveyMetricsGridProps) {
  return (
    <section aria-label="Métricas de participación" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {buildMetricCards(metrics).map((card) => (
        <SurveyMetricCard key={card.title} {...card} isLoading={isLoading} />
      ))}
    </section>
  );
}
