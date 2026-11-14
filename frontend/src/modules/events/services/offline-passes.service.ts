import { ACCESS_TOKEN_STORAGE_KEY } from '@/shared/constants/auth.constants';
import { OFFLINE_PASSES_STORAGE_KEY } from '@/shared/constants/offline-passes.constants';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import {
  readIndexedDbPair,
  updateIndexedDbPair,
} from '@/shared/services/storage/browser-indexed-db';
import { readAccessTokenSubject } from '@/shared/utils/read-access-token-subject';
import type { OfflinePass } from '../types/offline-pass.types';
import type { PassData } from '../types/pass-data.types';

type SavedOfflinePass = OfflinePass & { savedAt: string };

interface OfflinePassCache {
  ownerId: string;
  passes: SavedOfflinePass[];
}

function readAccountCache(value: unknown, ownerId: string): SavedOfflinePass[] {
  const cache = value as Partial<OfflinePassCache> | null | undefined;
  return cache?.ownerId === ownerId && Array.isArray(cache.passes)
    ? cache.passes
    : [];
}

export async function saveOfflinePass(
  pass: PassData,
  accessToken: string,
  signal?: AbortSignal,
): Promise<void> {
  const ownerId = readAccessTokenSubject(accessToken);
  if (!ownerId || pass.status !== 'Confirmada' || signal?.aborted) return;

  const savedPass: SavedOfflinePass = {
    id: pass.id,
    qrToken: pass.qrToken,
    eventName: pass.eventName,
    date: pass.date,
    startTime: pass.startTime,
    endTime: pass.endTime,
    location: pass.location,
    status: pass.status,
    savedAt: new Date().toISOString(),
  };
  await updateIndexedDbPair(
    ACCESS_TOKEN_STORAGE_KEY,
    OFFLINE_PASSES_STORAGE_KEY,
    (persistedToken, cache) => {
      // A response that arrived after logout or a switch must not recreate a copy.
      if (
        persistedToken !== accessToken ||
        getAccessToken() !== accessToken ||
        signal?.aborted
      )
        return {};

      const passes = readAccountCache(cache, ownerId).filter(
        ({ id }) => id !== pass.id,
      );
      return { secondary: { ownerId, passes: [...passes, savedPass] } };
    },
  );
}

export async function listOfflinePasses(
  accessToken = getAccessToken(),
): Promise<SavedOfflinePass[]> {
  const ownerId = readAccessTokenSubject(accessToken);
  if (!accessToken || !ownerId || getAccessToken() !== accessToken) return [];

  const [persistedToken, cache] = await readIndexedDbPair(
    ACCESS_TOKEN_STORAGE_KEY,
    OFFLINE_PASSES_STORAGE_KEY,
  );
  if (persistedToken !== accessToken || getAccessToken() !== accessToken)
    return [];
  return readAccountCache(cache, ownerId);
}
