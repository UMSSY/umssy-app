import type { SurveySummaryRowProps } from "../types/survey-component-props.types";

export function SurveySummaryRow({ label, children }: SurveySummaryRowProps) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0">
      <dt className="shrink-0 text-text-secondary">{label}</dt>
      <dd className="min-w-0 text-right font-semibold text-ink">{children}</dd>
    </div>
  );
}
