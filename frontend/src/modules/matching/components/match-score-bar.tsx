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

function mixAffinityFill(t: number): string {
  const blueShare = Math.round(t * 100);
  return `color-mix(in srgb, var(--color-accent) ${blueShare}%, var(--color-brand-red))`;
}

export function MatchScoreBar({ score, showLabel = true, size = "md", className }: MatchScoreProps) {
  const normalizedScore = normalizeMatchScore(score);

  const t = Math.min(Math.max(normalizedScore / HIGH_AFFINITY_THRESHOLD, 0), 1);
  const fillColor = mixAffinityFill(t);

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