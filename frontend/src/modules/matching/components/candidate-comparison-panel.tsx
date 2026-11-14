"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/shared/utils/get-initials";
import type { CandidateComparisonPanelProps } from "../types/candidate-comparison-panel-props.types";
import { RadarChart } from "./radar-chart";
import { GapBreakdownList } from "./gap-breakdown-list";

export function EmptyCandidatePanel() {
  return (
    <Card className="flex h-full items-center justify-center">
      <CardContent className="text-center text-sm text-muted-foreground">
        Selecciona un candidato de la lista para ver su detalle.
      </CardContent>
    </Card>
  );
}

export function CandidateComparisonPanel({
  name,
  role,
  matchPercent,
  vacancyTitle,
  scores,
  target,
  gaps,
  axes,
  onAxisSelect,
  status,
  children,
}: CandidateComparisonPanelProps) {
  return (
    <Card className="flex h-full flex-col overflow-y-auto">
      <CardHeader>
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              {getInitials(name)}
            </span>
            <div className="min-w-0 break-words">
              <CardTitle className="text-base">{name}</CardTitle>
              <p className="text-sm text-muted-foreground">{role}</p>
              {status && (
                <p className="mt-1 text-xs text-muted-foreground">{status}</p>
              )}
            </div>
          </div>
          <div className="min-w-0 break-words sm:max-w-[45%] sm:text-right">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Compatibilidad vs. {vacancyTitle}
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {matchPercent}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <RadarChart
          axes={axes}
          series={[
            {
              id: "candidate",
              name: `Postulante: ${name}`,
              color: "var(--color-radar-candidate)",
              values: scores,
            },
            {
              id: "target",
              name: "Objetivo de la vacante",
              color: "var(--color-radar-target)",
              values: target,
            },
          ]}
          onAxisSelect={onAxisSelect}
        />
        <GapBreakdownList axes={axes} gaps={gaps} />
        {children}
      </CardContent>
    </Card>
  );
}
