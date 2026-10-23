import { cn } from "cn";
import type { SurveyResultChartProps } from "../types/survey-result-chart-props.types";
import { formatOptionPercentage } from "../utils/format-survey-metrics";

// Columnas verticales (lista desplegable, que suele tener rangos). La altura de cada columna es su porcentaje.
export function SurveyColumnBars({ options, highlightedId, unit }: SurveyResultChartProps) {
  return (
    <div className="overflow-x-auto">
      <ul className="flex min-w-max items-end gap-3 pt-2 sm:min-w-0">
        {options.map((option) => {
          const percentage = formatOptionPercentage(option.percentage);
          return (
            <li
              key={option.id}
              aria-label={`${option.text}: ${option.count} ${unit}, ${percentage}`}
              className="flex w-20 flex-col items-center gap-1 text-center sm:w-auto sm:flex-1"
            >
              <span className="text-sm font-semibold text-ink tabular-nums" aria-hidden="true">
                {percentage}
              </span>
              <span className="flex h-36 w-full max-w-16 items-end rounded-t-md bg-surface-soft" aria-hidden="true">
                <span
                  data-testid="option-bar"
                  className={cn("block w-full rounded-t-md", option.id === highlightedId ? "bg-danger" : "bg-primary")}
                  style={{ height: `${option.percentage}%` }}
                />
              </span>
              <span className="text-xs text-ink-soft" aria-hidden="true">
                {option.text}
              </span>
              <span className="text-xs text-text-secondary tabular-nums" aria-hidden="true">
                {option.count} {unit}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
