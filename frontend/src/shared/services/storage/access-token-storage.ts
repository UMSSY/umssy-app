import { ACCESS_TOKEN_STORAGE_KEY } from '@/shared/constants/auth.constants';
import { readAccessTokenSubject } from '@/shared/utils/read-access-token-subject';
import { readIndexedDb, removeIndexedDb } from './browser-indexed-db';
import { offlinePassesKey } from '@/shared/constants/offline-passes.constants';
import { claimOfflinePasses, endOfflinePassesSession, readOfflinePassesOwner } from './offline-passes-owner';

let token: string | null = null;
let ready = false;
let revision = 0;
let loading: Promise<void> | null = null;
let writes: Promise<unknown> = Promise.resolve();
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;
const emit = () => {
  for (const listener of listeners) listener();
};
const clearOfflinePassesOfOtherUser = async (userId: string | null) => {
  const owner = await readOfflinePassesOwner();
  if (owner && owner !== userId) await endOfflinePassesSession(owner);
};

export function isAccessTokenReady(): boolean {
  return ready;
}
export function initializeAccessTokenStorage(): Promise<void> {
  if (ready) return Promise.resolve();
  if (loading) return loading;
  const currentRevision = revision;
  loading = readIndexedDb<unknown>(ACCESS_TOKEN_STORAGE_KEY)
    .then(async (legacyToken) => {
      const legacyUser = readAccessTokenSubject(legacyToken);
      if (!legacyUser || revision !== currentRevision) return;
      const owner = await readOfflinePassesOwner();
      const copy = await readIndexedDb<{ userId?: unknown; passes?: unknown }>(offlinePassesKey(legacyUser));
      if (!owner && revision === currentRevision && copy?.userId === legacyUser && Array.isArray(copy.passes))
        await claimOfflinePasses(legacyUser);
    })
    .catch(() => {})
    .then(() => removeIndexedDb(ACCESS_TOKEN_STORAGE_KEY).catch(() => {}))
    .finally(() => {
      if (revision !== currentRevision) return;
      ready = true;
      loading = null;
      emit();
    });
  return loading;
}

export async function saveAccessToken(value: string): Promise<boolean> {
  const nextOwner = readAccessTokenSubject(value);
  revision++;
  token = value;
  ready = true;
  emit();
  channel?.postMessage('changed');
  const operation = writes.then(async () => {
    await removeIndexedDb(ACCESS_TOKEN_STORAGE_KEY).catch(() => {});
    await clearOfflinePassesOfOtherUser(nextOwner);
  });
  writes = operation.catch(() => {});
  try {
    await operation;
  } catch {
  }
  return true;
}

export function getAccessToken(): string | null {
  return token;
}

export const getAuthToken = getAccessToken;

export async function waitForAccessTokenWrites(): Promise<void> {
  await writes;
}

export function clearAccessToken(): boolean {
  const previousUser = readAccessTokenSubject(token);
  const logoutRevision = ++revision;
  token = null;
  ready = true;
  loading = null;
  emit();
  const operation = writes.then(async () => {
    await removeIndexedDb(ACCESS_TOKEN_STORAGE_KEY).catch(() => {});
    const owner = previousUser ?? (revision === logoutRevision ? await readOfflinePassesOwner() : null);
    if (owner) await endOfflinePassesSession(owner);
  });
  writes = operation.catch(() => {});
  void operation.then(() => channel?.postMessage('changed')).catch(() => {});
  return true;
}

export function subscribeAccessToken(onChange: () => void): () => void {
  listeners.add(onChange);
  if (
    typeof window !== 'undefined' &&
    typeof BroadcastChannel !== 'undefined' &&
    !channel
  ) {
    channel = new BroadcastChannel('umssy-session');
    channel.onmessage = () => {
      revision++;
      token = null;
      ready = false;
      loading = null;
      emit();
      void initializeAccessTokenStorage();
    };
  }
  void initializeAccessTokenStorage();
  return () => {
    listeners.delete(onChange);
    if (!listeners.size) {
      channel?.close();
      channel = null;
    }
  };
}
