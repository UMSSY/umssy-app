"use client";

import {
  CandidateComparisonPanel,
  EmptyCandidatePanel,
} from "./candidate-comparison-panel";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AreaDetailPanel } from "@/modules/radar-chart";
import {
  useRecruiterAreaEvidence,
  useRecruiterDecision,
} from "../hooks/use-radar-recruiter";
import { useRecruiterCv } from "../hooks/use-recruiter-cv";
import { EMPTY_AREA_EVIDENCE } from "../constants/empty-area-evidence.constants";
import { RECRUITER_APPLICATION_STATE_LABELS } from "../constants/recruiter-application-state.constants";
import type { RadarAxisId } from "../types/radar-axis-id.types";
import type { RecruiterApplicationState } from "../types/recruiter-application-state.types";
import { buildAreaDetail } from "../utils/build-area-detail";

import type { RecruiterCandidatePanelProps } from "../types/recruiter-candidate-panel-props.types";

function hasOpenState(state: RecruiterApplicationState) {
  return state === "applied" || state === "interview";
}

export function RecruiterCandidatePanel({
  candidate,
  vacancy,
  axes,
}: RecruiterCandidatePanelProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<RadarAxisId | null>(
    null,
  );
  const cv = useRecruiterCv(candidate?.applicationId ?? "");
  const evidenceQuery = useRecruiterAreaEvidence(
    candidate?.applicationId ?? "",
    selectedAreaId,
  );
  const decision = useRecruiterDecision();

  if (!candidate || !vacancy) {
    return <EmptyCandidatePanel />;
  }

  const stateLabel =
    RECRUITER_APPLICATION_STATE_LABELS[candidate.state] ?? candidate.state;

  return (
    <CandidateComparisonPanel
      name={candidate.name}
      role={candidate.headline || "Perfil sin presentación"}
      matchPercent={candidate.comparison.match}
      vacancyTitle={vacancy.title}
      scores={candidate.scores}
      target={vacancy.target}
      gaps={candidate.comparison.gaps}
      axes={axes}
      status={stateLabel}
      onAxisSelect={setSelectedAreaId}
    >
      {selectedAreaId && (
        <div
          className="flex min-w-0 flex-col gap-2"
          role="region"
          aria-label={`Evidencias de ${candidate.name}`}
        >
          <p className="text-xs text-muted-foreground">
            Sólo se muestran evidencias que el titular autorizó compartir con
            reclutadores.
          </p>

          {evidenceQuery.isPending ? (
            <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Cargando evidencias autorizadas...
            </p>
          ) : evidenceQuery.isError ? (
            <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p role="alert" className="text-sm text-destructive">
                No se pudieron cargar las evidencias autorizadas.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="self-start"
                onClick={() => void evidenceQuery.refetch()}
              >
                Reintentar evidencias
              </Button>
            </div>
          ) : (
            <AreaDetailPanel
              area={buildAreaDetail({
                areaId: selectedAreaId,
                score: candidate.scores[selectedAreaId] ?? 0,
                average: candidate.average,
                evidence: evidenceQuery.data ?? EMPTY_AREA_EVIDENCE,
              })}
              onClose={() => setSelectedAreaId(null)}
            />
          )}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <p className="font-medium text-foreground">
            Datos de contacto autorizados
          </p>
          {candidate.email || candidate.phone ? (
            <dl className="mt-1 flex flex-col gap-1 break-words text-muted-foreground">
              {candidate.email && (
                <div>
                  <dt className="text-xs">Correo electrónico</dt>
                  <dd>{candidate.email}</dd>
                </div>
              )}
              {candidate.phone && (
                <div>
                  <dt className="text-xs">Teléfono</dt>
                  <dd>{candidate.phone}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-1 text-muted-foreground">
              El candidato no autorizó compartir sus datos de contacto.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {candidate.canViewCv ? (
            <Button
              type="button"
              variant="outline"
              disabled={cv.isPending}
              onClick={() => cv.mutate()}
            >
              {cv.isPending ? "Abriendo CV..." : "Revisar CV"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              El candidato no autorizó compartir su CV.
            </p>
          )}

          {cv.isError && (
            <p role="alert" className="text-sm text-destructive">
              No se pudo abrir el CV autorizado. Intenta nuevamente.
            </p>
          )}
        </div>

        {hasOpenState(candidate.state) ? (
          <>
            <Button
              type="button"
              className="w-full"
              disabled={decision.isPending}
              onClick={() =>
                decision.mutate({
                  applicationId: candidate.applicationId,
                  decision: "hired",
                })
              }
            >
              Aceptar postulación
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={decision.isPending}
              onClick={() =>
                decision.mutate({
                  applicationId: candidate.applicationId,
                  decision: "rejected",
                })
              }
            >
              Rechazar postulación
            </Button>
          </>
        ) : (
          <p className="rounded-md border border-border bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
            {stateLabel}.
          </p>
        )}

        {decision.isError && (
          <p role="alert" className="text-sm text-destructive">
            No se pudo registrar la decisión. Intenta nuevamente.
          </p>
        )}
      </div>
    </CandidateComparisonPanel>
  );
}
