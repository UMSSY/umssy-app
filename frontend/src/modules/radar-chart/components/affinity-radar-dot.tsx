"use client";

import { cn } from "@/lib/utils";
import type { AffinityRadarDotProps } from "../types/radar-profile-components.types";
import { formatDecimal } from "../utils/format-decimal";

export function AffinityRadarDot({ area, cx, cy, onAreaClick, className }: AffinityRadarDotProps) {
  return (
    <g
      data-testid={`radar-dot-${area.id}`}
      onClick={onAreaClick ? () => onAreaClick(area.id) : undefined}
      onKeyDown={onAreaClick ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onAreaClick(area.id); } } : undefined}
      role={onAreaClick ? "button" : undefined}
      tabIndex={onAreaClick ? 0 : undefined}
      aria-label={`Ver evidencias de ${area.name}: ${formatDecimal(area.score, 1)} de 10`}
      className={onAreaClick ? "group cursor-pointer outline-none" : undefined}
    >
      <title>{`${area.name}: ${formatDecimal(area.score, 1)}`}</title>
      <circle cx={cx} cy={cy} r={16} fill="transparent" pointerEvents="all" />
      <circle
        cx={cx}
        cy={cy}
        r={4.5}
        strokeWidth={2}
        pointerEvents="none"
        className={cn("fill-accent stroke-surface group-hover:[r:6px] group-focus-visible:[r:7px] motion-safe:transition-[r]", className)}
      />
    </g>
  );
}
