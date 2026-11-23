"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

import type { MatchScoreProps } from "../types/match-score.types";
import { normalizeMatchScore } from "../utils/normalize-match-score";
import { HIGH_AFFINITY_THRESHOLD } from "../constants/job-matching.constants";

const SIZE_CLASSES = {
  sm: "[&_[data-slot=progress-track]]:h-2",
  md: "[&_[data-slot=progress-track]]:h-3",
  lg: "[&_[data-slot=progress-track]]:h-4",
} as const;

type Rgb = [number, number, number];

const BRAND_RED_RGB: Rgb = [227, 6, 19];
const ACCENT_BLUE_RGB: Rgb = [0, 55, 112];

function interpolateRgb(t: number, low: Rgb, high: Rgb): string {
  const r = Math.round(low[0] + (high[0] - low[0]) * t);
  const g = Math.round(low[1] + (high[1] - low[1]) * t);
  const b = Math.round(low[2] + (high[2] - low[2]) * t);
  return `rgb(${r} ${g} ${b})`;
}

export function MatchScoreBar({ score, showLabel = true, size = "md", className }: MatchScoreProps) {
  const normalizedScore = normalizeMatchScore(score);

  const t = Math.min(Math.max(normalizedScore / HIGH_AFFINITY_THRESHOLD, 0), 1);
  const fillColor = interpolateRgb(t, BRAND_RED_RGB, ACCENT_BLUE_RGB);

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm font-medium text-foreground">
          <span>{"Afinidad"}</span>
          <span className="font-semibold">{normalizedScore}%</span>
        </div>
      )}
      <Progress
        value={normalizedScore}
        aria-label={"Afinidad"}
        className={cn(
          "w-full",
          SIZE_CLASSES[size],
          "[&_[data-slot=progress-indicator]]:!bg-[var(--affinity-fill)]",
          "[&_[data-slot=progress-indicator]]:transition-all [&_[data-slot=progress-indicator]]:duration-300",
        )}
        style={{ "--affinity-fill": fillColor } as React.CSSProperties}
      />
    </div>
  );
}