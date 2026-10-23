"use client";

import { cn } from "@/lib/utils";
import type { AffinityRadarDotProps } from "../types/radar-profile-components.types";
import { formatDecimal } from "../utils/format-decimal";

export function AffinityRadarDot({ area, cx, cy, onAreaClick, className }: AffinityRadarDotProps) {
  return (
    <g
      data-testid={`radar-dot-${area.id}`}
      onClick={onAreaClick ? () => onAreaClick(area.id) : undefined}
      className={onAreaClick ? "group cursor-pointer" : undefined}
    >
      <title>{`${area.name}: ${formatDecimal(area.score, 1)}`}</title>
      <circle cx={cx} cy={cy} r={12} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={4.5}
        strokeWidth={2}
        className={cn("fill-accent stroke-surface group-hover:[r:6px] motion-safe:transition-[r]", className)}
      />
    </g>
  );
}
