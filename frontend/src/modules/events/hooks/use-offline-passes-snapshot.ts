"use client";

import { useQuery } from "@tanstack/react-query";
import { OFFLINE_PASSES_SNAPSHOT_QUERY_KEY } from "../constants/offline-passes.constants";
import { offlinePassesStore } from "../utils/offline-passes-store";

import type { OfflinePassesSnapshot } from "../types/offline-passes-snapshot.types";
import type { OfflinePassesSnapshotState } from "../types/offline-passes-snapshot-state.types";

export function useOfflinePassesSnapshot(
  userId: string | null,
  isOnline: boolean,
): OfflinePassesSnapshotState {
  const query = useQuery({
    queryKey: [OFFLINE_PASSES_SNAPSHOT_QUERY_KEY, userId, isOnline],
    queryFn: () => offlinePassesStore.load(userId as string),
    enabled: Boolean(userId),
    networkMode: "always",
    placeholderData: (previous: OfflinePassesSnapshot | null | undefined) =>
      previous?.userId === userId ? previous : undefined,
  });
  return {
    snapshot: userId ? (query.data ?? null) : null,
    isLoading: Boolean(userId) && query.isPending,
  };
}
