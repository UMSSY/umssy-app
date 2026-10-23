"use client";

import { useState } from "react";
import { AreaDetailPanel } from "@/modules/radar-chart";
import type { AreaId } from "@/modules/radar-chart";
import { getCandidateAreaDetail } from "../data/candidate-area-evidence.data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateField } from "@/shared/components/date-field";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/shared/utils/get-initials";
import { RadarChart } from "./radar-chart";
import { GapBreakdownList } from "./gap-breakdown-list";
import { ConfirmDiscardDialog } from "./confirm-discard-dialog";
import type { AffinityAxis, CandidateWithMatch, Vacancy } from "../types/matching-types";

type InlineAction = "contact" | "schedule" | null;

interface CandidateDetailPanelProps {
  candidate: CandidateWithMatch | null;
  vacancy: Vacancy | null;
  axes: AffinityAxis[];
  pendingDiscardId: string | null;
  onRequestDiscard: (id: string) => void;
  onConfirmDiscard: () => void;
  onCancelDiscard: () => void;
  onConfirmSchedule: (name: string, date: string, time: string) => void;
  actionFeedback: string | null;
}

export function CandidateDetailPanel({
  candidate,
  vacancy,
  axes,
  pendingDiscardId,
  onRequestDiscard,
  onConfirmDiscard,
  onCancelDiscard,
  onConfirmSchedule,
  actionFeedback,
}: CandidateDetailPanelProps) {
  const [inlineAction, setInlineAction] = useState<InlineAction>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const hasValidScheduleDate = /^\d{4}-\d{2}-\d{2}$/.test(scheduleDate);
  const [selectedAreaId, setSelectedAreaId] = useState<AreaId | null>(null);

  if (!candidate || !vacancy) {
    return (
      <Card className="flex h-full items-center justify-center">
        <CardContent className="text-center text-sm text-muted-foreground">
          Selecciona un candidato de la lista para ver su detalle.
        </CardContent>
      </Card>
    );
  }

  const isDiscarded = candidate.status === "discarded";
  const isPendingDiscard = pendingDiscardId === candidate.id;

  function handleSubmitSchedule() {
    if (!candidate || !hasValidScheduleDate || !scheduleTime) return;

    onConfirmSchedule(candidate.name, scheduleDate, scheduleTime);
    setInlineAction(null);
    setScheduleDate("");
    setScheduleTime("");
  }

  return (
    <Card className="flex h-full flex-col overflow-y-auto">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              {getInitials(candidate.name)}
            </span>
            <div>
              <CardTitle className="text-base">{candidate.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{candidate.role}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Compatibilidad vs. {vacancy.title}
            </p>
            <p className="text-2xl font-semibold text-foreground">{candidate.matchPercent}%</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5">
        <RadarChart
          axes={axes.map((axis) => ({ id: axis.id, label: axis.label }))}
          series={[
            {
              id: "candidate",
              name: `Postulante: ${candidate.name}`,
              color: "var(--color-radar-candidate)",
              values: candidate.scores,
            },
            {
              id: "target",
              name: "Objetivo de la vacante",
              color: "var(--color-radar-target)",
              values: vacancy.targetProfile,
            },
          ]}
          onAxisSelect={setSelectedAreaId}
        />

        <GapBreakdownList axes={axes} gaps={candidate.gaps} />

        {selectedAreaId && (
          <div className="flex min-w-0 flex-col gap-2" role="region" aria-label={`Evidencias de ${candidate.name}`}>
            <p className="text-xs text-muted-foreground">
              Información ilustrativa de {candidate.name}; cursos, certificaciones y experiencias de demostración.
            </p>
            <AreaDetailPanel
              area={getCandidateAreaDetail(candidate, selectedAreaId)}
              onClose={() => setSelectedAreaId(null)}
            />
          </div>
        )}

        {actionFeedback && (
          <div className="rounded-md border border-border-strong/30 bg-ink-soft/10 px-3 py-2 text-sm text-ink-soft dark:text-ink-soft">
            {actionFeedback}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-2">
          {isDiscarded ? (
            <p className="rounded-md border border-border bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
              Este perfil fue descartado.
            </p>
          ) : (
            <div className="grid grid-cols-3 items-stretch gap-3" aria-label="Acciones del candidato">
              <Button
                type="button"
                className="h-auto min-h-10 w-full whitespace-normal"
                aria-expanded={inlineAction === "contact"}
                onClick={() => setInlineAction(inlineAction === "contact" ? null : "contact")}
              >
                Contactar candidato
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-10 w-full border-accent whitespace-normal text-accent hover:bg-interaction hover:text-accent"
                aria-expanded={inlineAction === "schedule"}
                onClick={() => setInlineAction(inlineAction === "schedule" ? null : "schedule")}
              >
                Agendar entrevista
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-10 w-full border-brand-red/40 whitespace-normal text-danger hover:bg-brand-red/5 hover:text-danger"
                onClick={() => onRequestDiscard(candidate.id)}
              >
                Descartar perfil
              </Button>
            </div>
          )}

          <ConfirmDiscardDialog
            open={isPendingDiscard && !isDiscarded}
            candidateName={candidate.name}
            onConfirm={onConfirmDiscard}
            onCancel={onCancelDiscard}
          />

          {inlineAction === "contact" && !isDiscarded && (
            <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
              <p className="font-medium text-foreground">Datos de contacto</p>
              <p className="mt-1 text-muted-foreground">
                {candidate.name.toLowerCase().replace(/\s+/g, ".")}@umss-egresados.bo
              </p>
              <p className="text-muted-foreground" aria-label="Teléfono de demostración">
                {candidate.demoPhone}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Datos ficticios: no utilizar para contactar.</p>
            </div>
          )}

          {inlineAction === "schedule" && !isDiscarded && (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-sm font-medium text-foreground">Proponer entrevista</p>
              <div className="flex gap-2">
                <DateField
                  value={scheduleDate}
                  onValueChange={setScheduleDate}
                  aria-label="Fecha de entrevista"
                />
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(event) => setScheduleTime(event.target.value)}
                  aria-label="Hora de entrevista"
                />
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!hasValidScheduleDate || !scheduleTime}
                onClick={handleSubmitSchedule}
              >
                Confirmar propuesta
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
