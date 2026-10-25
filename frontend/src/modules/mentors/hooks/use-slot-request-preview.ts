"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/modules/auth/services/auth.service";
import { getAccessToken, subscribeAccessToken } from "@/shared/services/storage/access-token-storage";
import { isSlotRequestPreviewEnabled, simulateSlotRequest, simulateSlotCancellation, type PendingSlotRequest, type SlotRequestScenario, type SlotCancellationScenario } from "../services/slot-request-preview.service";

type PreviewState = { request: PendingSlotRequest | null; notice: "registered" | "duplicate" | "cancelled" | null };
const emptyState: PreviewState = { request: null, notice: null };
const getServerToken = () => null;

export function useSlotRequestPreview() {
  const enabled = isSlotRequestPreviewEnabled();
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);
  const client = useQueryClient();
  const key = ["mentor-slot-request-preview", token];
  const query = useQuery<PreviewState>({ queryKey: key, queryFn: () => emptyState, enabled: false, initialData: emptyState, gcTime: Infinity });
  const session = useQuery({ queryKey: ["auth-session", token], queryFn: () => authService.getSession(token), enabled: enabled && Boolean(token), retry: false });
  const inFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState<string | null>(null);

  async function submit(scenario: SlotRequestScenario, areas: string[], orientations: string[]) {
    if (!enabled || inFlight.current) return;
    const current = client.getQueryData<PreviewState>(key);
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
    if (!enabled || inFlight.current) return false;
    const current = client.getQueryData<PreviewState>(key);
    if (!current?.request) return false;
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

  return {
    enabled,
    request: enabled ? query.data.request : null,
    notice: enabled ? query.data.notice : null,
    email: session.data?.email ?? "Correo institucional no disponible",
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
