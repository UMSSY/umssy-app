"use client";

import {
  CandidateComparisonPanel,
  EmptyCandidatePanel,
} from "./candidate-comparison-panel";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AreaDetailPanel } from "@/modules/radar-chart";
import {
  getOrCreateConversation,
  useMessagingUi,
  type Conversation,
} from "@/modules/chat";
import { useRecruiterAreaEvidence } from "../hooks/use-radar-recruiter";
import { useRecruiterCv } from "../hooks/use-recruiter-cv";
import { EMPTY_AREA_EVIDENCE } from "../constants/empty-area-evidence.constants";
import { RECRUITER_APPLICATION_STATE_LABELS } from "../constants/recruiter-application-state.constants";
import type { RadarAxisId } from "../types/radar-axis-id.types";
import { buildAreaDetail } from "../utils/build-area-detail";

import type { RecruiterCandidatePanelProps } from "../types/recruiter-candidate-panel-props.types";

export function RecruiterCandidatePanel({
  candidate,
  vacancy,
  axes,
}: RecruiterCandidatePanelProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<RadarAxisId | null>(
    null,
  );
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagingUi = useMessagingUi();
  const queryClient = useQueryClient();
  const cv = useRecruiterCv(candidate?.applicationId ?? "");
  const evidenceQuery = useRecruiterAreaEvidence(
    candidate?.applicationId ?? "",
    selectedAreaId,
  );

  if (!candidate || !vacancy) {
    return <EmptyCandidatePanel />;
  }

  const stateLabel =
    RECRUITER_APPLICATION_STATE_LABELS[candidate.state] ?? candidate.state;
  const candidateUserId = candidate.userId;
  const candidateApplicationId = candidate.applicationId;
  const candidateHeadline = candidate.headline || "Perfil sin presentación";

  async function openCandidateChat() {
    if (isStartingChat) return;

    setIsStartingChat(true);
    setChatError(null);

    try {
      const rawConversation = await getOrCreateConversation(candidateUserId, {
        contextType: "POSTULACION",
        contextId: candidateApplicationId,
      });
      const conversation: Conversation = rawConversation.contact
        ? {
            ...rawConversation,
            contact: {
              ...rawConversation.contact,
              academicTitle:
                rawConversation.contact.academicTitle ?? candidateHeadline,
            },
          }
        : rawConversation;

      queryClient.setQueryData(
        ["chat", "conversations"],
        (current: Conversation[] | undefined) => {
          const conversations = current ?? [];
          const existingIndex = conversations.findIndex(
            (item) => item.id === conversation.id,
          );
          if (existingIndex >= 0) {
            return conversations.map((item, index) =>
              index === existingIndex ? conversation : item,
            );
          }
          return [conversation, ...conversations];
        },
      );

      messagingUi?.setSelectedId(conversation.id);
      messagingUi?.setIsPanelOpen(true);
    } catch {
      setChatError(
        "No se pudo abrir el chat del postulante. Verifica tu conexión e intenta nuevamente.",
      );
    } finally {
      setIsStartingChat(false);
    }
  }

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

        <Button
          id="recruiter-contact-button"
          type="button"
          data-vacancy-title={vacancy.title}
          data-candidate-headline={candidateHeadline}
          className="min-h-11 w-full"
          disabled={isStartingChat}
          onClick={() => void openCandidateChat()}
        >
          {isStartingChat
            ? "Abriendo mensajes..."
            : chatError
              ? "Reintentar Contactar"
              : "Contactar"}
        </Button>

        {chatError && (
          <p role="alert" className="text-sm text-destructive">
            {chatError}
          </p>
        )}
      </div>
    </CandidateComparisonPanel>
  );
}
