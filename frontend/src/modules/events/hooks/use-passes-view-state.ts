"use client";

import { useEffect, useState } from "react";
import { useRegistrationSession } from "@/modules/registrations";
import { OFFLINE_PASSES_CLOCK_INTERVAL_MS } from "../constants/offline-passes.constants";
import { formatLastUpdated } from "../utils/format-last-updated";
import { getTokenUserId } from "../utils/get-token-user-id";
import { isSnapshotStale } from "../utils/is-snapshot-stale";
import { useMyPasses } from "./use-my-passes";
import { useOfflinePassesSnapshot } from "./use-offline-passes-snapshot";
import { useOnlineStatus } from "./use-online-status";

import type { PassesViewState } from "../types/passes-view-state.types";

export function usePassesViewState(): PassesViewState {
  const userId = getTokenUserId(useRegistrationSession());
  const isOnline = useOnlineStatus();
  const live = useMyPasses();
  const { snapshot, isLoading: isSnapshotLoading } = useOfflinePassesSnapshot(userId, isOnline);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), OFFLINE_PASSES_CLOCK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const saved = snapshot?.passes ?? [];
  const base = {
    isOnline,
    offlineQrTokens: Object.fromEntries(saved.map(({ id, qrToken }) => [id, qrToken])),
    lastUpdated: snapshot ? formatLastUpdated(snapshot.savedAt) : null,
    retry: live.retry,
  };
  const savedView = (isStale: boolean, error: string | null): PassesViewState => ({
    ...base,
    status: "saved",
    passes: saved.map(({ id, eventName, date, startTime, endTime, location, status }) => ({
      id, eventName, date, startTime, endTime, status, location: location ?? "",
    })),
    isStale,
    error,
  });
  const emptyView = (status: PassesViewState["status"], error: string | null = null): PassesViewState => ({
    ...base,
    status,
    passes: [],
    isStale: false,
    error,
  });

  if (!isOnline) {
    if (isSnapshotLoading) return emptyView("loading");
    if (!snapshot || !saved.length) return emptyView("no-offline-copy");
    return savedView(isSnapshotStale(snapshot.savedAt, now), null);
  }
  if (live.isLoading) return emptyView("loading");
  if (live.error) return saved.length ? savedView(true, live.error) : emptyView("error", live.error);
  return { ...base, status: "live", passes: live.registrations, isStale: false, error: null };
}
