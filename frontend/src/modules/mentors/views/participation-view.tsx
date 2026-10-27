"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/contexts/auth-context";
import { getAccessToken, subscribeAccessToken } from "@/shared/services/storage/access-token-storage";
import { mentorParticipationService } from "../services/mentor-participation.service";
import { ParticipationEmptyState } from "../components/participation/participation-empty-state";
import { ParticipationLoading } from "../components/participation/participation-loading";
import { ParticipationOverview } from "../components/participation/participation-overview";
import { PendingParticipation } from "../components/participation/pending-participation";
import { SlotOfferParticipation } from "../components/participation/slot-offer-participation";
import { SlotAvailability } from "../components/participation/slot-availability";
import { ActivateParticipationModal } from "../components/participation/activate-participation-modal";
import { DeactivateParticipationModal } from "../components/participation/deactivate-participation-modal";
import { useParticipation } from "../hooks/use-participation";
import { participationErrorCode, participationErrorMessage } from "../utils/participation-error";
import { loadMentorshipWizardDraft, saveMentorshipWizardDraft } from "@/modules/mentorship";

const getServerToken = () => null;

export function ParticipationView({ registered = false, activated = false }: { registered?: boolean; activated?: boolean }) {
  const router = useRouter();
  const client = useQueryClient();
  const { refreshRoles } = useAuth();
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);
  const participation = useParticipation(token);
  const request = useQuery({
    queryKey: ["mentor-participation-requests", token],
    queryFn: () => mentorParticipationService.getCurrent(),
    enabled: Boolean(token),
    retry: false,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
  const [modal, setModal] = useState<"activate" | "deactivate" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [hasDraftStorageError, setHasDraftStorageError] = useState(false);
  const [notice, setNotice] = useState<string | null>(activated ? "Participación activada correctamente" : registered ? "Solicitud de cupo registrada correctamente" : null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const deactivate = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await mentorParticipationService.leave();
      await Promise.allSettled([
        refreshRoles(),
        client.invalidateQueries({ queryKey: ["mentors", "participation"] }),
        client.invalidateQueries({ queryKey: ["mentor-participation-requests"] }),
        client.invalidateQueries({ queryKey: ["mentorship", "directory"] }),
        client.invalidateQueries({ queryKey: ["mentorship", "profile"] }),
      ]);
      setModal(null);
      setNotice("Participación desactivada correctamente");
    } catch (failure) {
      setError(failure);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  if (!token || participation.isLoading || request.isPending) return <ParticipationLoading />;
  if (participation.hasLoadError || request.isError || !participation.state) return (
    <main className="mx-auto max-w-7xl"><Alert variant="destructive">
      <p>No se pudo cargar tu participación como mentor.</p>
      <Button variant="outline" onClick={() => { participation.retry(); void request.refetch(); }}>Reintentar</Button>
    </Alert></main>
  );

  const state = participation.state;
  const isActive = state.status === "ACTIVE";
  const hasHistory = state.status === "DEACTIVATED";
  const currentRequest = request.data;

  return <div className="mx-auto max-w-7xl space-y-6">
    {notice && <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
      <span>{notice}</span><Button variant="ghost" onClick={() => setNotice(null)} aria-label="Cerrar notificación">×</Button>
    </div>}
    {(isActive || hasHistory) && <ParticipationOverview
      isActive={isActive}
      actionEnabled={isActive || !["PENDING", "OFFERED"].includes(currentRequest?.status ?? "")}
      areas={state.areas.map((area) => area.name)}
      orientations={state.orientations.map((orientation) => orientation.name)}
      onAction={() => { setError(null); setHasDraftStorageError(false); setModal(isActive ? "deactivate" : "activate"); }}
    />}
    {!isActive && currentRequest?.status === "PENDING" &&
      <PendingParticipation request={currentRequest} showHeading={!hasHistory} onCancelled={() => setNotice("Solicitud cancelada correctamente")} />}
    {!isActive && currentRequest?.status === "OFFERED" &&
      (currentRequest.offer
        ? <SlotOfferParticipation key={currentRequest.offer.id} request={currentRequest} showHeading={!hasHistory} onConfirmed={() => { void refreshRoles(); void client.invalidateQueries({ queryKey: ["mentors", "participation"] }); void client.invalidateQueries({ queryKey: ["mentorship", "directory"] }); void client.invalidateQueries({ queryKey: ["mentorship", "profile"] }); setNotice("Participación activada correctamente"); }} />
        : <Alert variant="destructive">No se pudo consultar la oferta. Actualiza la página.</Alert>)}
    {!isActive && !hasHistory && !["PENDING", "OFFERED"].includes(currentRequest?.status ?? "") &&
      <div className="space-y-6"><SlotAvailability /><ParticipationEmptyState /></div>}
    {hasHistory && ["EXPIRED", "CANCELLED"].includes(currentRequest?.status ?? "") &&
      <p role="status">{currentRequest?.status === "EXPIRED" ? "La oferta venció." : "La solicitud fue cancelada."} Puedes revisar las condiciones vigentes en el proceso de incorporación.</p>}
    <DeactivateParticipationModal
      isOpen={modal === "deactivate"} onClose={() => setModal(null)}
      onConfirm={() => void deactivate()} isLoading={submitting}
      errorMessage={error ? participationErrorMessage(error) : null}
      hasFutureAppointments={participationErrorCode(error) === "MENTOR_HAS_FUTURE_APPOINTMENTS"}
      areas={state.areas.map((area) => area.name)} orientations={state.orientations.map((orientation) => orientation.name)}
    />
    <ActivateParticipationModal
      isOpen={modal === "activate"} onClose={() => setModal(null)}
      onConfirm={() => {
        void (async () => {
          if (hasDraftStorageError) {
            setModal(null);
            router.push("/mentorship");
            return;
          }
          try {
            const draft = await loadMentorshipWizardDraft();
            if (!draft) await saveMentorshipWizardDraft({
              currentStep: 1,
              wantsToParticipate: true,
              selectedTechnicalAreaIds: state.areas.map((area) => area.id),
              selectedOrientationTypeIds: state.orientations.map((orientation) => orientation.id),
            });
            setModal(null);
            router.push("/mentorship");
          } catch {
            setHasDraftStorageError(true);
          }
        })();
      }}
      isLoading={false} errorMessage={hasDraftStorageError ? "No se pudo recuperar el borrador. Puedes continuar y seleccionar tus preferencias nuevamente." : null}
    />
  </div>;
}
