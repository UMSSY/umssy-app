"use client";

import { Progress } from "@/components/ui/progress";

type MatchScoreBarProps = ({ value: number; score?: never } | { score: number; value?: never }) & {
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function MatchScoreBar({ value, score: suppliedScore, showLabel = true, size = "md", className = "" }: MatchScoreBarProps) {
  const raw = value ?? suppliedScore ?? 0;
  const score = Number.isFinite(raw) ? Math.max(0, Math.min(100, Math.round(raw))) : 0;
  const heights = {
    sm: "[&_[data-slot=progress-track]]:h-2",
    md: "[&_[data-slot=progress-track]]:h-3",
    lg: "[&_[data-slot=progress-track]]:h-4",
  };
  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel ? <div className="flex justify-between gap-3 text-sm font-medium"><span>Compatibilidad</span><span>{score}%</span></div> : null}
      <Progress value={score} aria-label="Compatibilidad" className={`w-full ${heights[size]}`} />
    </div>
  );
}

