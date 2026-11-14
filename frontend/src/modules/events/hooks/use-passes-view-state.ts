"use client";

import { useRegistrationSession } from "@/modules/registrations";
import { formatLastUpdated } from "../utils/format-last-updated";
import { getTokenUserId } from "../utils/get-token-user-id";
import { useMyPasses } from "./use-my-passes";
import { useOfflinePassesSnapshot } from "./use-offline-passes-snapshot";
import { useOnlineStatus } from "./use-online-status";

import type { PassesViewState } from "../types/passes-view-state.types";

export function usePassesViewState(): PassesViewState {
  const userId = getTokenUserId(useRegistrationSession());
  const isOnline = useOnlineStatus();
  const live = useMyPasses();
  const { snapshot, isLoading: isSnapshotLoading } = useOfflinePassesSnapshot(userId, isOnline);

  const saved = snapshot?.passes ?? [];
  const base = {
    isOnline,
    offlineQrTokens: Object.fromEntries(saved.map(({ id, qrToken }) => [id, qrToken])),
    lastUpdated: snapshot ? formatLastUpdated(snapshot.savedAt) : null,
    isConnectionError: false,
    retry: live.retry,
  };
  const savedView = (error: string | null): PassesViewState => ({
    ...base,
    status: "saved",
    passes: saved.map(({ id, eventName, date, startTime, endTime, location, status }) => ({
      id, eventName, date, startTime, endTime, status, location: location ?? "",
    })),
    error,
  });
  const emptyView = (status: PassesViewState["status"], error: string | null = null): PassesViewState => ({
    ...base,
    status,
    passes: [],
    error,
  });

  if (!isOnline) {
    if (isSnapshotLoading) return emptyView("loading");
    if (!snapshot || !saved.length) return emptyView("no-offline-copy");
    return savedView(null);
  }
  if (live.isLoading) return emptyView("loading");
  if (live.error) {
    return saved.length
      ? savedView(live.error)
      : { ...emptyView("error", live.error), isConnectionError: live.isConnectionError };
  }
  return { ...base, status: "live", passes: live.registrations, error: null };
}
