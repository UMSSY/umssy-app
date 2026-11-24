import { MAX_SCORE } from "@/modules/radar-chart/constants/radar-score.constants";
import { Button } from "@/components/ui/button";
import { useId } from "react";
import { cn } from "@/lib/utils";
import type { AreaLevel } from "../types/area-level.types";
import type { AreaBreakdownPanelProps } from "../types/area-breakdown-panel-props.types";
import { formatDecimal } from "../utils/format-decimal";
import { getAreaLevel } from "../utils/get-area-level";
import { AreaLevelBadge } from "./area-level-badge";
import { RadarCard } from "./radar-card";

const BAR_CLASS: Record<AreaLevel, string> = {
  Bajo: 'bg-border-strong',
  Medio: 'bg-ink-soft',
  Alto: 'bg-ink',
  Experto: 'bg-accent',
};

function toPercent(score: number): string {
  return `${Math.min(Math.max(score / MAX_SCORE, 0), 1) * 100}%`;
}

export function AreaBreakdownPanel({
  areas,
  average,
  className,
  onAreaClick,
  compact = false,
  selectedArea,
}: AreaBreakdownPanelProps) {
  const titleId = useId();

  if (compact)
    return (
      <RadarCard
        as="aside"
        aria-labelledby={titleId}
        className={cn('p-4', className)}
      >
        <h2 id={titleId} className="font-semibold text-ink">
          Desglose por área
        </h2>
        <ul className="mt-2 space-y-1">
          {areas.map((area) => {
            const level = getAreaLevel(area.score);
            return (
              <li key={area.id} data-testid={`area-breakdown-${area.id}`}>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`Seleccionar ${area.name}`}
                  aria-pressed={selectedArea === area.id}
                  className="h-auto min-h-12 w-full justify-between gap-2 px-2 py-1 text-sm"
                  onClick={() => onAreaClick?.(area.id)}
                >
                  <span className="min-w-0 text-left whitespace-normal">
                    {area.name}
                  </span>
                  <AreaLevelBadge level={level} />
                  <span className="shrink-0 tabular-nums">
                    {formatDecimal(area.score, 1)} / 10
                  </span>
                </Button>
                <div className="mx-2 mb-2 h-1.5 rounded-full bg-border" aria-hidden="true">
                  <div
                    className={cn('h-full rounded-full', BAR_CLASS[level])}
                    style={{ width: toPercent(area.score) }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 flex justify-between gap-2 border-t border-border pt-2 text-xs text-text-secondary">
          <span>Media global</span>
          <span className="font-semibold tabular-nums">
            {formatDecimal(average, 2)} / 10
          </span>
        </p>
      </RadarCard>
    );

  return (
    <RadarCard as="aside" aria-labelledby={titleId} className={cn("flex flex-col rounded-2xl p-5", className)}>
      <h2 id={titleId} className="text-sm font-medium text-accent">
        Desglose por área
      </h2>
      <ul className="mt-2 flex flex-col divide-y divide-border border-b border-border">
        {areas.map((area) => {
          const level = getAreaLevel(area.score);

          return (
            <li key={area.id} data-testid={`area-breakdown-${area.id}`}>
              <Button type="button" variant="ghost" onClick={() => onAreaClick?.(area.id)} aria-pressed={selectedArea === area.id} aria-label={`Seleccionar ${area.name}`} className={cn("flex min-h-12 w-full items-center gap-2 rounded-none px-2 text-left focus-visible:outline-2 focus-visible:outline-accent", selectedArea === area.id && "bg-interaction text-accent")}>
                <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">
                  {area.name}
                </span>
                <AreaLevelBadge level={level} />
                <span className="w-8 text-right text-xs font-semibold text-ink tabular-nums">
                  {formatDecimal(area.score, 1)}
                </span>
              </Button>
              <div className="mx-2 mb-2 h-1.5 rounded-full bg-border" aria-hidden="true">
                <div
                  className={cn('h-full rounded-full', BAR_CLASS[level])}
                  style={{ width: toPercent(area.score) }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="sr-only">
        <span className="text-xs font-semibold tracking-[0.12em] text-text-secondary uppercase">
          Media global
        </span>
        <p className="whitespace-nowrap">
          <span className="font-heading text-2xl leading-none font-semibold text-accent tabular-nums">
            {formatDecimal(average, 2)}
          </span>{' '}
          <span className="text-sm text-text-secondary">/ 10</span>
        </p>
      </div>
    </RadarCard>
  );
}
