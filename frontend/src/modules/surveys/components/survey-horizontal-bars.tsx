import { cn } from "cn";
import type { SurveyResultChartProps } from "../types/survey-result-chart-props.types";
import { formatOptionPercentage } from "../utils/format-survey-metrics";

// Barras horizontales (opción única y múltiple). El ancho de cada barra es su porcentaje real
// sobre 100, así lo que se ve coincide con el número mostrado.
export function SurveyHorizontalBars({ options, highlightedId, unit }: SurveyResultChartProps) {
  return (
    <ul className="flex flex-col gap-3">
      {options.map((option) => {
        const percentage = formatOptionPercentage(option.percentage);
        return (
          <li
            key={option.id}
            aria-label={`${option.text}: ${option.count} ${unit}, ${percentage}`}
            className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_6.5rem]"
          >
            <span className="col-span-2 text-ink-soft sm:col-span-1">{option.text}</span>
            <span className="h-3 overflow-hidden rounded-full bg-surface-soft" aria-hidden="true">
              <span
                data-testid="option-bar"
                className={cn("block h-full rounded-full", option.id === highlightedId ? "bg-danger" : "bg-primary")}
                style={{ width: `${option.percentage}%` }}
              />
            </span>
            <span className="text-right whitespace-nowrap text-ink tabular-nums" aria-hidden="true">
              {option.count} | {percentage}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
