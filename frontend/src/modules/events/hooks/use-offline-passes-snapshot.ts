'use client';

import { useQuery } from '@tanstack/react-query';
import { OFFLINE_PASSES_SNAPSHOT_QUERY_KEY } from '../constants/offline-passes.constants';
import { loadSessionOfflinePasses } from '../utils/offline-passes-store';
import { getTokenUserId } from '../utils/get-token-user-id';

import type { OfflinePassesSnapshot } from '../types/offline-passes-snapshot.types';
import type { OfflinePassesSnapshotState } from '../types/offline-passes-snapshot-state.types';

export function useOfflinePassesSnapshot(
  accessToken: string | null,
  isOnline: boolean,
): OfflinePassesSnapshotState {
  const userId = getTokenUserId(accessToken);
  const enabled = Boolean(userId) || !accessToken;
  const query = useQuery({
    queryKey: [OFFLINE_PASSES_SNAPSHOT_QUERY_KEY, accessToken, isOnline],
    queryFn: () => loadSessionOfflinePasses(accessToken),
    enabled,
    networkMode: 'always',
    placeholderData: (previous: OfflinePassesSnapshot | null | undefined) =>
      previous?.userId === userId ? previous : undefined,
  });
  return {
    snapshot: enabled ? (query.data ?? null) : null,
    isLoading: enabled && query.isPending,
  };
}
