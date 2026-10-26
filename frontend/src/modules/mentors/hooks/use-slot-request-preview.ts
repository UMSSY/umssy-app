"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/modules/auth/services/auth.service";
import { useAuth } from "@/shared/contexts/auth-context";
import { isApiError } from "@/shared/services/api-client";
import { cancelParticipation, confirmOffer as confirmParticipationOffer, getParticipation, requestParticipation } from "@/modules/mentorship/services/mentor-participation.service";
import { getAccessToken, subscribeAccessToken } from "@/shared/services/storage/access-token-storage";
import { isSlotRequestPreviewEnabled, simulateSlotRequest, simulateSlotCancellation, type PendingSlotRequest, type SlotRequestScenario, type SlotCancellationScenario } from "../services/slot-request-preview.service";
import { simulateSlotOffer, simulateOfferConfirmation, type SlotOffer } from "../services/slot-request-preview.service";

type PreviewState = { request: PendingSlotRequest | null; notice: "registered" | "duplicate" | "cancelled" | "offered" | "confirmed" | null; offer?: SlotOffer | null; active?: PendingSlotRequest | null };
const emptyState: PreviewState = { request: null, notice: null };
const getServerToken = () => null;

export function useSlotRequestPreview() {
  const enabled = isSlotRequestPreviewEnabled();
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);
  const client = useQueryClient();
  const { refreshRoles } = useAuth();
  const key = ["mentor-slot-request-preview", token];
  const query = useQuery<PreviewState>({ queryKey: key, queryFn: () => emptyState, enabled: false, initialData: emptyState, gcTime: Infinity });
  const session = useQuery({ queryKey: ["auth-session", token], queryFn: () => authService.getSession(token), enabled: enabled && Boolean(token), retry: false });
  const real = useQuery({ queryKey: ["mentor-participation", "me", token], queryFn: ({ signal }) => getParticipation(signal),
    enabled: !enabled, refetchInterval: 15_000 });
  const inFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  async function submit(scenario: SlotRequestScenario, areas: string[], orientations: string[],
    ids?: { technicalAreaIds: string[]; orientationTypeIds: string[] }) {
    if (inFlight.current) return;
    if (!enabled) {
      if (!ids) { setError("Completa las áreas técnicas y tipos de orientación antes de solicitar."); return; }
      inFlight.current = true; setIsSubmitting(true); setError(null);
      try {
        await requestParticipation(ids);
        await client.invalidateQueries({ queryKey: ["mentor-participation"] });
        client.setQueryData<PreviewState>(key, (current) => ({ ...(current ?? emptyState), notice: "registered" }));
      } catch (failure) {
        const code = isApiError(failure) ? (failure.response?.data as { data?: { code?: string } } | undefined)?.data?.code : null;
        if (code === "DUPLICATE_REQUEST") {
          await client.invalidateQueries({ queryKey: ["mentor-participation"] });
          client.setQueryData<PreviewState>(key, (current) => ({ ...(current ?? emptyState), notice: "duplicate" }));
        } else if (code === "SLOT_AVAILABLE") {
          setError("Se liberó un cupo. Cierra este aviso y confirma la activación en el formulario.");
        } else {
          if (code === "MENTOR_REQUEST_SUSPENDED") await client.invalidateQueries({ queryKey: ["mentor-participation"] });
          setError(isApiError(failure) ? (failure.response?.data as { detail?: string } | undefined)?.detail ?? "No se pudo registrar tu solicitud." : "No se pudo registrar tu solicitud.");
        }
      } finally { inFlight.current = false; setIsSubmitting(false); }
      return;
    }
    const current = client.getQueryData<PreviewState>(key);
    if (current?.offer || current?.active) return;
    if (current?.request) {
      client.setQueryData(key, { ...current, notice: "duplicate" });
      return;
    }
    inFlight.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await simulateSlotRequest(scenario, areas, orientations);
      const existing = client.getQueryData<PreviewState>(key);
      client.setQueryData<PreviewState>(key, existing?.request
        ? { ...existing, notice: "duplicate" }
        : { request: result.request, notice: result.duplicate ? "duplicate" : "registered" });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "No se pudo registrar tu solicitud.");
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  }

  async function cancel(scenario: SlotCancellationScenario) {
    if (inFlight.current) return false;
    if (!enabled) {
      inFlight.current = true; setIsCancelling(true); setCancellationError(null);
      try {
        await cancelParticipation();
        await client.invalidateQueries({ queryKey: ["mentor-participation"] });
        client.setQueryData<PreviewState>(key, (current) => ({ ...(current ?? emptyState), notice: "cancelled" }));
        return true;
      } catch (failure) {
        setCancellationError(isApiError(failure) ? (failure.response?.data as { detail?: string } | undefined)?.detail ?? "No se pudo cancelar tu solicitud." : "No se pudo cancelar tu solicitud.");
        return false;
      } finally { inFlight.current = false; setIsCancelling(false); }
    }
    const current = client.getQueryData<PreviewState>(key);
    if (!current?.request || current.offer || current.active) return false;
    inFlight.current = true;
    setIsCancelling(true);
    setCancellationError(null);
    try {
      const response = await simulateSlotCancellation(scenario, current.request.id);
      const latest = client.getQueryData<PreviewState>(key);
      if (latest?.request?.id !== response.id) {
        setCancellationError("El estado de tu solicitud cambió. Vuelve a consultar tu participación.");
        return false;
      }
      client.setQueryData<PreviewState>(key, { request: null, notice: "cancelled" });
      return true;
    } catch (failure) {
      setCancellationError(failure instanceof Error ? failure.message : "No se pudo cancelar tu solicitud.");
      return false;
    } finally {
      inFlight.current = false;
      setIsCancelling(false);
    }
  }

  function offerSlot(expired = false) {
    if (!enabled || inFlight.current) return;
    const current = client.getQueryData<PreviewState>(key);
    if (!current?.request || current.offer || current.active) return;
    client.setQueryData<PreviewState>(key, { ...current, offer: simulateSlotOffer(current.request.id, expired), notice: "offered" });
  }

  async function confirmOffer(scenario: "success" | "error") {
    if (inFlight.current) return;
    if (!enabled) {
      const offerId = real.data?.request?.offer?.id;
      if (!offerId) return;
      inFlight.current = true; setIsConfirming(true); setConfirmationError(null);
      try {
        await confirmParticipationOffer(offerId);
        try { await refreshRoles(); } catch { /* The confirmed state is refreshed below. */ }
        await client.invalidateQueries({ queryKey: ["mentor-participation"] });
        client.setQueryData<PreviewState>(key, (current) => ({ ...(current ?? emptyState), notice: "confirmed" }));
      } catch (failure) {
        setConfirmationError(isApiError(failure) ? (failure.response?.data as { detail?: string } | undefined)?.detail ?? "No se pudo confirmar tu participación." : "No se pudo confirmar tu participación.");
        await client.invalidateQueries({ queryKey: ["mentor-participation"] });
      } finally { inFlight.current = false; setIsConfirming(false); }
      return;
    }
    const current = client.getQueryData<PreviewState>(key);
    if (!current?.offer || !current.request) return;
    if (Date.now() >= Date.parse(current.offer.expiresAt)) { setConfirmationError("El plazo ha vencido"); return; }
    inFlight.current = true;
    setIsConfirming(true);
    setConfirmationError(null);
    try {
      const result = await simulateOfferConfirmation(scenario, current.offer);
      const latest = client.getQueryData<PreviewState>(key);
      if (latest?.offer?.id !== result.offerId || latest.request?.id !== result.requestId || Date.now() >= Date.parse(current.offer.expiresAt)) {
        setConfirmationError("La oferta cambió o el plazo ha vencido. Vuelve a consultar tu participación.");
        return;
      }
      client.setQueryData<PreviewState>(key, { request: null, offer: null, active: current.request, notice: "confirmed" });
    } catch (failure) {
      setConfirmationError(failure instanceof Error ? failure.message : "No se pudo confirmar tu participación.");
    } finally { inFlight.current = false; setIsConfirming(false); }
  }

  function allowNewRequest() {
    if (!enabled || inFlight.current) return;
    const current = client.getQueryData<PreviewState>(key);
    if (!current?.offer || Date.now() < Date.parse(current.offer.expiresAt)) return;
    // Explicit simulated server status; expiration alone does not grant permission.
    client.setQueryData<PreviewState>(key, { ...current, offer: { ...current.offer, canRequestAgain: true } });
  }

  function restartAfterExpiry() {
    const current = client.getQueryData<PreviewState>(key);
    if (enabled && !inFlight.current && current?.offer?.canRequestAgain && Date.now() >= Date.parse(current.offer.expiresAt)) client.setQueryData(key, emptyState);
  }

  return {
    enabled,
    realState: enabled ? null : real.data ?? null,
    isLoading: !enabled && real.isPending,
    loadError: !enabled && real.isError,
    reload: () => real.refetch(),
    request: enabled ? query.data.request : real.data?.status === "PENDING" ? {
      id: real.data.request!.id, registeredAt: real.data.request!.requestedAt,
      areas: real.data.request!.technicalAreas.map((area) => area.name),
      orientations: real.data.request!.orientationTypes.map((orientation) => orientation.name),
    } : null,
    offer: enabled ? query.data.offer ?? null : ["OFFERED", "EXPIRED"].includes(real.data?.status ?? "") && real.data?.request?.offer ? {
      id: real.data.request.offer.id, requestId: real.data.request.id,
      expiresAt: real.data.request.offer.expiresAt, canRequestAgain: real.data.status === "EXPIRED",
    } : null,
    active: enabled ? query.data.active ?? null : real.data?.status === "ACTIVE" && real.data.request ? {
      id: real.data.request.id, registeredAt: real.data.request.requestedAt,
      areas: real.data.request.technicalAreas.map((area) => area.name),
      orientations: real.data.request.orientationTypes.map((orientation) => orientation.name),
    } : null,
    offerSlot,
    confirmOffer,
    isConfirming,
    confirmationError,
    allowNewRequest,
    restartAfterExpiry,
    notice: query.data.notice,
    email: (enabled ? session.data?.email : real.data?.email) ?? "Correo institucional no disponible",
    isSubmitting,
    error,
    submit,
    cancel,
    isCancelling,
    cancellationError,
    clearCancellationError: () => setCancellationError(null),
    dismissNotice: () => client.setQueryData<PreviewState>(key, (current) => ({ ...(current ?? emptyState), notice: null })),
    reset: () => client.setQueryData(key, emptyState),
  };
}
