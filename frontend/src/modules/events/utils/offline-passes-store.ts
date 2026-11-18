import {
  readIndexedDbPair,
  updateIndexedDbPair,
  readIndexedDb,
  removeIndexedDb,
  removeIndexedDbByPrefix,
  writeIndexedDb,
} from '@/shared/services/storage/browser-indexed-db';
import { ACCESS_TOKEN_STORAGE_KEY } from '@/shared/constants/auth.constants';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { offlinePassesKey } from '@/shared/constants/offline-passes.constants';
import { readAccessTokenSubject } from '@/shared/utils/read-access-token-subject';
import {
  clearPendingPassRemovals,
  readPendingPassRemovals,
} from '@/shared/services/storage/pending-offline-pass-removals';
import {
  OFFLINE_PASSES_KEY_PREFIX,
  OFFLINE_QR_TOKEN_PATTERN,
} from '../constants/offline-passes.constants';

import type { OfflinePass } from '../types/offline-pass.types';
import type { OfflinePassesSnapshot } from '../types/offline-passes-snapshot.types';
import type { OfflinePassesStore } from '../types/offline-passes-store.types';

const keyFor = offlinePassesKey;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isText = (value: unknown): value is string => typeof value === 'string';

function toOfflinePass(value: unknown): OfflinePass | null {
  if (!isRecord(value)) return null;
  const { id, eventName, date, startTime, endTime, location, status, qrToken } =
    value;
  if (![id, eventName, date, startTime, endTime, status].every(isText))
    return null;
  if (location !== null && !isText(location)) return null;
  if (!isText(qrToken) || !OFFLINE_QR_TOKEN_PATTERN.test(qrToken)) return null;
  return {
    id: id as string,
    eventName: eventName as string,
    date: date as string,
    startTime: startTime as string,
    endTime: endTime as string,
    location,
    status: status as string,
    qrToken,
  };
}

function toSnapshot(
  value: unknown,
  userId: string,
): OfflinePassesSnapshot | null {
  if (!isRecord(value) || value.userId !== userId) return null;
  if (!isText(value.savedAt) || Number.isNaN(Date.parse(value.savedAt)))
    return null;
  if (!Array.isArray(value.passes)) return null;
  const passes = value.passes
    .map(toOfflinePass)
    .filter((pass) => pass !== null);
  return { userId, savedAt: value.savedAt, passes };
}

export async function loadSessionOfflinePasses(
  accessToken: string,
): Promise<OfflinePassesSnapshot | null> {
  const userId = readAccessTokenSubject(accessToken);
  if (!userId || getAccessToken() !== accessToken) return null;
  try {
    const [persistedToken, snapshot] = await readIndexedDbPair(
      ACCESS_TOKEN_STORAGE_KEY,
      keyFor(userId),
    );
    if (persistedToken !== accessToken || getAccessToken() !== accessToken)
      return null;
    return await withoutPendingRemovals(
      toSnapshot(snapshot, userId),
      accessToken,
      userId,
    );
  } catch {
    return null;
  }
}

// Passes whose cancellation was confirmed but could not be removed locally are hidden
// right away, and their removal is retried without contacting the server again.
async function withoutPendingRemovals(
  snapshot: OfflinePassesSnapshot | null,
  accessToken: string,
  userId: string,
): Promise<OfflinePassesSnapshot | null> {
  const pending = readPendingPassRemovals(userId);
  if (!snapshot || pending.length === 0) return snapshot;
  const visible = {
    ...snapshot,
    passes: snapshot.passes.filter(({ id }) => !pending.includes(id)),
  };
  try {
    await updateSessionOfflinePasses(accessToken, undefined, (current) =>
      current
        ? {
            ...current,
            savedAt: new Date().toISOString(),
            passes: current.passes.filter(({ id }) => !pending.includes(id)),
          }
        : undefined,
    );
    if (getAccessToken() === accessToken)
      clearPendingPassRemovals(userId, pending);
  } catch {}
  return visible;
}

export async function updateSessionOfflinePasses(
  accessToken: string,
  signal: AbortSignal | undefined,
  update: (
    snapshot: OfflinePassesSnapshot | null,
    userId: string,
  ) => OfflinePassesSnapshot | null | undefined,
): Promise<OfflinePassesSnapshot | null | undefined> {
  const userId = readAccessTokenSubject(accessToken);
  if (!userId || signal?.aborted || getAccessToken() !== accessToken) return;
  let next: OfflinePassesSnapshot | null | undefined;
  await updateIndexedDbPair(
    ACCESS_TOKEN_STORAGE_KEY,
    keyFor(userId),
    (persistedToken, snapshot) => {
      if (
        persistedToken !== accessToken ||
        getAccessToken() !== accessToken ||
        signal?.aborted
      )
        return {};
      next = update(toSnapshot(snapshot, userId), userId);
      return { secondary: next };
    },
  );
  return getAccessToken() === accessToken && !signal?.aborted
    ? next
    : undefined;
}

export const offlinePassesStore: OfflinePassesStore = {
  async save(userId, passes) {
    const snapshot: OfflinePassesSnapshot = {
      userId,
      savedAt: new Date().toISOString(),
      passes: passes
        .map((pass) => toOfflinePass(pass))
        .filter((pass) => pass !== null),
    };
    await writeIndexedDb(keyFor(userId), snapshot);
  },
  async load(userId) {
    try {
      return toSnapshot(await readIndexedDb<unknown>(keyFor(userId)), userId);
    } catch {
      return null;
    }
  },
  clearUser: (userId) => removeIndexedDb(keyFor(userId)),
  clearAll: () => removeIndexedDbByPrefix(OFFLINE_PASSES_KEY_PREFIX),
};
