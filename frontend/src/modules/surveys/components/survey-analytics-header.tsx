import type { SurveyAnalyticsHeaderProps } from "../types/survey-component-props.types";

export function SurveyAnalyticsHeader({ title, description, actions }: SurveyAnalyticsHeaderProps) {
  return (
    <header className="sticky top-app-header z-20 -mx-12 -mt-10 border-b border-border bg-surface-soft px-12 py-3">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-tight text-2xl leading-tight font-bold tracking-tight text-accent">{title}</h1>
          <p className="mt-0.5 text-sm text-text-secondary">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
