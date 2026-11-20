"use client";

import {
  CandidateComparisonPanel,
  EmptyCandidatePanel,
} from "./candidate-comparison-panel";
import type { InlineAction } from "../types/inline-action.types";
import type { CandidateDetailPanelProps } from "../types/candidate-detail-panel-props.types";

import { useState } from "react";
import { AreaDetailPanel } from "@/modules/radar-chart";
import type { AreaId } from "@/modules/radar-chart";
import { getCandidateAreaDetail } from "../data/candidate-area-evidence.data";
import { Button } from "@/components/ui/button";
import { DateField } from "@/shared/components/date-field";
import { Input } from "@/components/ui/input";
import { ConfirmDiscardDialog } from "./confirm-discard-dialog";

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
    return <EmptyCandidatePanel />;
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
    <CandidateComparisonPanel
      name={candidate.name}
      role={candidate.role}
      matchPercent={candidate.matchPercent}
      vacancyTitle={vacancy.title}
      scores={candidate.scores}
      target={vacancy.targetProfile}
      gaps={candidate.gaps}
      axes={axes}
      onAxisSelect={setSelectedAreaId}
    >
      {selectedAreaId && (
        <div
          className="flex min-w-0 flex-col gap-2"
          role="region"
          aria-label={`Evidencias de ${candidate.name}`}
        >
          <p className="text-xs text-muted-foreground">
            Información ilustrativa de {candidate.name}; cursos, certificaciones
            y experiencias de demostración.
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
          <div
            className="grid grid-cols-3 items-stretch gap-3"
            aria-label="Acciones del candidato"
          >
            <Button
              type="button"
              className="h-auto min-h-10 w-full whitespace-normal"
              aria-expanded={inlineAction === "contact"}
              onClick={() =>
                setInlineAction(inlineAction === "contact" ? null : "contact")
              }
            >
              Contactar candidato
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-10 w-full border-accent whitespace-normal text-accent hover:bg-interaction hover:text-accent"
              aria-expanded={inlineAction === "schedule"}
              onClick={() =>
                setInlineAction(inlineAction === "schedule" ? null : "schedule")
              }
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
              {candidate.name.toLowerCase().replace(/\s+/g, ".")}
              @umss-egresados.bo
            </p>
            <p
              className="text-muted-foreground"
              aria-label="Teléfono de demostración"
            >
              {candidate.demoPhone}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Datos ficticios: no utilizar para contactar.
            </p>
          </div>
        )}

        {inlineAction === "schedule" && !isDiscarded && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/50 p-3">
            <p className="text-sm font-medium text-foreground">
              Proponer entrevista
            </p>
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
    </CandidateComparisonPanel>
  );
}
