
"use client";

import { Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DetectedSkillsChipsProps } from "../types/detected-skills-chips-props.types";

export function DetectedSkillsChips({
  skills = [],
  processingTimeMs,
  isLoading = false,
}: DetectedSkillsChipsProps) {
  if (skills.length === 0 && !isLoading) {
    return null;
  }

  const processingTimeSec =
    processingTimeMs !== undefined
      ? (processingTimeMs / 1000).toFixed(2)
      : null;

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-surface-soft/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
          <Sparkles
            className={cn("size-3.5 text-accent", isLoading && "animate-pulse")}
          />
          <span>Habilidades detectadas automáticamente</span>
        </div>

        {isLoading ? (
          <span
            className="text-[11px] text-text-secondary"
            role="status"
            aria-live="polite"
          >
            Analizando con NLP...
          </span>
        ) : processingTimeSec !== null ? (
          <div className="flex items-center gap-1 text-[11px] text-text-secondary">
            <Clock className="size-3" />
            <span>Análisis completado en {processingTimeSec} s</span>
          </div>
        ) : null}
      </div>

      {skills.length > 0 ? (
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
      ) : isLoading ? (
        <p className="text-xs text-text-secondary">
          Buscando habilidades en la descripción...
        </p>
      ) : null}
    </div>
  );
}
