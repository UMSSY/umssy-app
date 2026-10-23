import type { SurveyEmptyStateProps } from "../types/survey-empty-state-props.types";

export function SurveyEmptyState({ icon: Icon, title, description }: SurveyEmptyStateProps) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-10 text-center">
      <Icon className="size-10 text-text-secondary" strokeWidth={1.5} aria-hidden="true" />
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="max-w-md text-sm text-text-secondary">{description}</p>
    </section>
  );
}
