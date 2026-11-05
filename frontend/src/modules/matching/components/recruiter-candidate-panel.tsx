"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AreaDetailPanel } from "@/modules/radar-chart/components/area-detail-panel";
import { getInitials } from "@/shared/utils/get-initials";
import {
  useRecruiterAreaEvidence,
  useRecruiterDecision,
} from "../hooks/use-radar-recruiter";
import { radarRecruiterApi } from "../services/radar-recruiter.service";
import type {
  RadarAxis,
  RadarAxisId,
  RecruiterApplicant,
  RecruiterTarget,
} from "../types/radar-recruiter.types";
import { buildAreaDetail } from "../utils/build-area-detail";
import { GapBreakdownList } from "./gap-breakdown-list";
import { RadarChart } from "./radar-chart";

interface RecruiterCandidatePanelProps {
  candidate: RecruiterApplicant | null;
  vacancy: RecruiterTarget | null;
  axes: RadarAxis[];
}

const STATE_LABELS: Record<string, string> = {
  applied: "Postulación en revisión",
  interview: "En entrevista",
  hired: "Contratado",
  rejected: "No seleccionado",
  withdrawn: "Postulación retirada",
};

function hasOpenState(state: string) {
  return state === "applied" || state === "interview";
}

export function RecruiterCandidatePanel({
  candidate,
  vacancy,
  axes,
}: RecruiterCandidatePanelProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<RadarAxisId | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const evidenceQuery = useRecruiterAreaEvidence(
    candidate?.applicationId ?? "",
    selectedAreaId
  );
  const decision = useRecruiterDecision();

  if (!candidate || !vacancy) {
    return (
      <Card className="flex h-full items-center justify-center">
        <CardContent className="text-center text-sm text-muted-foreground">
          Selecciona un candidato de la lista para ver su detalle.
        </CardContent>
      </Card>
    );
  }

  const comparison = candidate.comparison;
  const stateLabel = STATE_LABELS[candidate.state] ?? candidate.state;

  async function handleOpenCv() {
    if (!candidate) return;

    setCvLoading(true);
    setCvError(null);
    try {
      const blob = await radarRecruiterApi.recruiterCv(candidate.applicationId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setCvError("No se pudo abrir el CV autorizado. Intenta nuevamente.");
    } finally {
      setCvLoading(false);
    }
  }

  return (
    <Card className="flex h-full flex-col overflow-y-auto">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              {getInitials(candidate.name)}
            </span>
            <div>
              <CardTitle className="text-base">{candidate.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {candidate.headline || "Perfil sin presentación"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stateLabel}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Compatibilidad vs. {vacancy.title}
            </p>
            {comparison ? (
              <p className="text-2xl font-semibold text-foreground">
                {comparison.match}%
              </p>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">
                Sin radar publicado
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5">
        {comparison ? (
          <>
            <RadarChart
              axes={axes.map((axis) => ({ id: axis.id, label: axis.label }))}
              series={[
                {
                  id: "candidate",
                  name: candidate.name,
                  color: "var(--color-accent)",
                  values: candidate.scores ?? {},
                },
                {
                  id: "target",
                  name: `Perfil objetivo · ${vacancy.title}`,
                  color: "var(--color-ink-soft)",
                  values: vacancy.target,
                },
              ]}
              onAxisSelect={setSelectedAreaId}
            />

            <GapBreakdownList axes={axes} gaps={comparison.gaps} />
          </>
        ) : (
          <div
            role="note"
            className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground"
          >
            Este candidato no tiene un radar publicado. No se muestra un porcentaje
            de compatibilidad para evitar datos inventados.
          </div>
        )}

        {selectedAreaId && comparison && (
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
                <p className="text-sm text-destructive">
                  No se pudieron cargar las evidencias autorizadas.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void evidenceQuery.refetch()}
                >
                  Reintentar evidencias
                </Button>
              </div>
            ) : (
              <AreaDetailPanel
                area={buildAreaDetail({
                  areaId: selectedAreaId,
                  score: candidate.scores?.[selectedAreaId] ?? 0,
                  average: candidate.average ?? 0,
                  evidence: evidenceQuery.data ?? {
                    education: [],
                    certifications: [],
                    experiences: [],
                    tags: [],
                  },
                })}
                onClose={() => setSelectedAreaId(null)}
              />
            )}
          </div>
        )}

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <p className="font-medium text-foreground">Datos de contacto autorizados</p>
          {candidate.email || candidate.phone ? (
            <div className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
              {candidate.email && <p>{candidate.email}</p>}
              {candidate.phone && <p>{candidate.phone}</p>}
            </div>
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
              disabled={cvLoading}
              onClick={() => void handleOpenCv()}
            >
              {cvLoading ? "Abriendo CV..." : "Ver CV autorizado"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              El candidato no autorizó compartir su CV.
            </p>
          )}

          {cvError && (
            <p role="alert" className="text-sm text-destructive">
              {cvError}
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-2">
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
                Contratar candidato
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
      </CardContent>
    </Card>
  );
}
