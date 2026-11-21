import {
  readIndexedDb,
  removeIndexedDb,
  writeIndexedDb,
} from '@/shared/services/storage/browser-indexed-db';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import {
  claimOfflinePasses,
  clearOfflinePasses,
  readOfflinePassesOwner,
  readOwnedOfflinePasses,
  updateOwnedOfflinePasses,
} from '@/shared/services/storage/offline-passes-owner';
import { offlinePassesKey } from '@/shared/constants/offline-passes.constants';
import { readAccessTokenSubject } from '@/shared/utils/read-access-token-subject';
import {
  clearPendingPassRemovals,
  readPendingPassRemovals,
} from '@/shared/services/storage/pending-offline-pass-removals';
import { OFFLINE_QR_TOKEN_PATTERN } from '../constants/offline-passes.constants';

import type { OfflinePass } from '../types/offline-pass.types';
import type { EventSession } from '../types/event-session.types';
import type { OfflinePassesSnapshot } from '../types/offline-passes-snapshot.types';
import type { OfflinePassesStore } from '../types/offline-passes-store.types';

const keyFor = offlinePassesKey;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isText = (value: unknown): value is string => typeof value === 'string';

function toOfflineSessions(value: unknown): EventSession[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const valid = value.every(
    (session) =>
      isRecord(session) &&
      [session.id, session.startsAt, session.endsAt].every(isText) &&
      (session.location === null || isText(session.location)),
  );
  return valid ? (value as EventSession[]) : undefined;
}

function toOfflinePass(value: unknown): OfflinePass | null {
  if (!isRecord(value)) return null;
  const { id, eventName, date, startTime, endTime, location, status, qrToken, sessions } =
    value;
  if (![id, eventName, date, startTime, endTime, status].every(isText))
    return null;
  if (location !== null && !isText(location)) return null;
  if (!isText(qrToken) || !OFFLINE_QR_TOKEN_PATTERN.test(qrToken)) return null;
  // Copias guardadas antes de las sesiones se leen como taller de una sesión.
  const offlineSessions = toOfflineSessions(sessions);
  return {
    id: id as string,
    eventName: eventName as string,
    date: date as string,
    startTime: startTime as string,
    endTime: endTime as string,
    location,
    status: status as string,
    qrToken,
    ...(offlineSessions && { sessions: offlineSessions }),
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
  accessToken: string | null,
): Promise<OfflinePassesSnapshot | null> {
  const sessionUserId = accessToken ? readAccessTokenSubject(accessToken) : null;
  if (accessToken && (!sessionUserId || getAccessToken() !== accessToken))
    return null;
  try {
    const owner = sessionUserId
      ? await confirmSessionOwner(sessionUserId)
      : await readOfflinePassesOwner();
    if (!owner || (sessionUserId && owner !== sessionUserId)) return null;
    const copy = await readOwnedOfflinePasses(owner);
    if (accessToken && getAccessToken() !== accessToken) return null;
    return await withoutPendingRemovals(toSnapshot(copy, owner), owner);
  } catch {
    return null;
  }
}

async function confirmSessionOwner(userId: string): Promise<string | null> {
  const owner = await readOfflinePassesOwner();
  if (owner) return owner;
  if (!toSnapshot(await readIndexedDb<unknown>(keyFor(userId)), userId)) return null;
  await claimOfflinePasses(userId);
  return userId;
}

async function withoutPendingRemovals(
  snapshot: OfflinePassesSnapshot | null,
  userId: string,
): Promise<OfflinePassesSnapshot | null> {
  const pending = readPendingPassRemovals(userId);
  if (!snapshot || pending.length === 0) return snapshot;
  const visible = {
    ...snapshot,
    passes: snapshot.passes.filter(({ id }) => !pending.includes(id)),
  };
  try {
    await updateOwnedOfflinePasses(userId, (copy) => {
      const current = toSnapshot(copy, userId);
      return current
        ? {
            ...current,
            savedAt: new Date().toISOString(),
            passes: current.passes.filter(({ id }) => !pending.includes(id)),
          }
        : undefined;
    });
    clearPendingPassRemovals(userId, pending);
  } catch {}
  return visible;
}

export async function claimSessionOfflinePasses(
  accessToken: string,
): Promise<void> {
  const userId = readAccessTokenSubject(accessToken);
  if (!userId || getAccessToken() !== accessToken) return;
  await claimOfflinePasses(userId);
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
  await claimOfflinePasses(userId);
  let next: OfflinePassesSnapshot | null | undefined;
  await updateOwnedOfflinePasses(userId, (copy) => {
    if (getAccessToken() !== accessToken || signal?.aborted) return undefined;
    next = update(toSnapshot(copy, userId), userId);
    return next;
  });
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
    await claimOfflinePasses(userId);
    await writeIndexedDb(keyFor(userId), snapshot);
  },
  async load(userId) {
    try {
      return toSnapshot(await readOwnedOfflinePasses(userId), userId);
    } catch {
      return null;
    }
  },
  clearUser: (userId) => removeIndexedDb(keyFor(userId)),
  clearAll: clearOfflinePasses,
};
