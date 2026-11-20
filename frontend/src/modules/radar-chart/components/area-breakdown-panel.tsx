import { MAX_SCORE } from "@/modules/radar-chart/constants/radar-score.constants";
import { Button } from "@/components/ui/button";
import { useId } from "react";
import { cn } from "@/lib/utils";
import type { AreaLevel } from "../types/area-detail.types";
import type { AreaBreakdownPanelProps } from "../types/radar-profile-components.types";
import { formatDecimal } from "../utils/format-decimal";
import { getAreaLevel } from "../utils/get-area-level";
import { AreaLevelBadge } from "./area-level-badge";
import { RadarCard } from "./radar-card";

const BAR_CLASS: Record<AreaLevel, string> = {
  Bajo: "bg-border-strong",
  Medio: "bg-ink-soft",
  Alto: "bg-ink",
  Experto: "bg-accent",
};

function toPercent(score: number): string {
  return `${Math.min(Math.max(score / MAX_SCORE, 0), 1) * 100}%`;
}

export function AreaBreakdownPanel({ areas, average, className, selectedArea, onAreaClick, actions }: AreaBreakdownPanelProps) {
  const titleId = useId();

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
              <Button type="button" variant="ghost" onClick={() => onAreaClick?.(area.id)} aria-pressed={selectedArea === area.id} aria-label={`Seleccionar ${area.name}`} className={cn("flex h-10 w-full items-center gap-2 rounded-none px-2 text-left focus-visible:outline-2 focus-visible:outline-accent", selectedArea === area.id && "bg-interaction text-accent")}>
                <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">
                  {area.name}
                </span>
                <span className="sr-only"><AreaLevelBadge level={level} /></span>
                <span className="w-8 text-right text-xs font-semibold text-ink tabular-nums">
                  {formatDecimal(area.score, 1)}
                </span>
              </Button>
              <div className="sr-only" aria-hidden="true">
                <div
                  className={cn("h-full rounded-full", BAR_CLASS[level])}
                  style={{ width: toPercent(area.score) }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {actions}

      <div className="sr-only">
        <span className="text-xs font-semibold tracking-[0.12em] text-text-secondary uppercase">
          Media global
        </span>
        <p className="whitespace-nowrap">
          <span className="font-heading text-2xl leading-none font-semibold text-accent tabular-nums">
            {formatDecimal(average, 2)}
          </span>{" "}
          <span className="text-sm text-text-secondary">/ 10</span>
        </p>
      </div>
    </RadarCard>
  );
}
