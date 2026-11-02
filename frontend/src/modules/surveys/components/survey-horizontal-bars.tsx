import { cn } from "cn";
import type { SurveyHorizontalBarsProps } from "../types/survey-component-props.types";

export function SurveyHorizontalBars({ options, highlightedId }: SurveyHorizontalBarsProps) {
  return (
    <ul className="flex flex-col gap-3">
      {options.map((option) => {
        const isHighlighted = option.id === highlightedId;
        return (
          <li
            key={option.id}
            aria-label={`${option.label}: ${option.count} votos, ${option.percentage}%`}
            className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_7rem]"
          >
            <span className={cn("col-span-2 text-sm sm:col-span-1", isHighlighted ? "font-semibold text-ink" : "text-ink-soft")}>
              {option.label}
            </span>
            <span className="h-3.5 overflow-hidden rounded-full border border-border/60 bg-surface-soft" aria-hidden="true">
              <span
                data-testid="option-bar"
                className={cn(
                  "block h-full rounded-full transition-all duration-500",
                  isHighlighted ? "bg-accent" : "bg-primary"
                )}
                style={{ width: `${Math.max(option.percentage, option.count > 0 ? 3 : 0)}%` }}
              />
            </span>
            <span className="text-right text-xs whitespace-nowrap tabular-nums sm:text-sm" aria-hidden="true">
              <span className="text-text-secondary">{option.count}</span> · <span className="font-semibold text-ink">{option.percentage}%</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
