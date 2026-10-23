import { Skeleton } from "@/components/ui/skeleton";
import type { SurveyMetricCardProps } from "../types/survey-metric-card-props.types";

export function SurveyMetricCard({ title, value, description, isLoading }: SurveyMetricCardProps) {
  return (
    <article
      aria-label={isLoading ? `${title}: cargando` : `${title}: ${value}`}
      aria-busy={isLoading}
      className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-surface p-5"
    >
      <h2 className="text-sm font-semibold text-ink-soft">{title}</h2>
      {isLoading ? (
        <>
          <Skeleton data-testid="metric-skeleton" className="h-9 w-24" />
          <Skeleton className="h-4 w-full" />
        </>
      ) : (
        <>
          <p className="font-tight text-3xl font-bold text-ink tabular-nums">{value}</p>
          <p className="text-sm text-text-secondary">{description}</p>
        </>
      )}
    </article>
  );
}
