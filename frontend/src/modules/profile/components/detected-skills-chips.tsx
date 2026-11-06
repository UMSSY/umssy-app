"use client";

import { Sparkles, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DetectedSkillsChipsProps } from "../types/detected-skills-chips-props.types";

export function DetectedSkillsChips({
  skills = [],
  processingTimeMs,
  isLoading = false,
}: DetectedSkillsChipsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-text-secondary">
        <Sparkles className="size-4 animate-spin text-accent" />
        <span>Analizando experiencia con NLP...</span>
      </div>
    );
  }

  if (!skills || skills.length === 0) {
    return null;
  }

  const processingTimeSec = processingTimeMs
    ? (processingTimeMs / 1000).toFixed(2)
    : "0.00";

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-surface-soft/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
          <Sparkles className="size-3.5 text-accent" />
          <span>Habilidades detectadas automáticamente</span>
        </div>
        {processingTimeMs !== undefined && (
          <div className="flex items-center gap-1 text-[11px] text-text-secondary">
            <Clock className="size-3" />
            <span>Análisis completado en {processingTimeSec} s</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {skills.map((skill) => (
          <Badge
            key={skill.id}
            variant="secondary"
            className="rounded-full border-transparent bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent hover:bg-accent/20"
          >
            {skill.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}