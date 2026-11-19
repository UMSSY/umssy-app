import {
  OFFLINE_PASSES_KEY_PREFIX,
  OFFLINE_PASSES_OWNER_KEY,
  OFFLINE_PASSES_STORAGE_KEY,
  offlinePassesKey,
  pendingPassRemovalsKey,
} from '@/shared/constants/offline-passes.constants';
import {
  readIndexedDb,
  readIndexedDbPair,
  removeIndexedDb,
  removeIndexedDbByPrefix,
  updateIndexedDbPair,
} from './browser-indexed-db';
import { removeLocalStorage } from './browser-local-storage';
import { revokeOfflineUser } from './offline-passes-session';

const asOwner = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

export async function readOfflinePassesOwner(): Promise<string | null> {
  return asOwner(await readIndexedDb<unknown>(OFFLINE_PASSES_OWNER_KEY));
}

export async function readOwnedOfflinePasses(
  userId: string,
): Promise<unknown> {
  const [owner, copy] = await readIndexedDbPair(
    OFFLINE_PASSES_OWNER_KEY,
    offlinePassesKey(userId),
  );
  return asOwner(owner) === userId ? copy : null;
}

export async function claimOfflinePasses(userId: string): Promise<void> {
  let previous: string | null = null;
  await updateIndexedDbPair(
    OFFLINE_PASSES_OWNER_KEY,
    (owner) => offlinePassesKey(asOwner(owner) ?? userId),
    (owner) => {
      previous = asOwner(owner);
      if (previous === userId) return {};
      return { primary: userId, secondary: previous ? null : undefined };
    },
  );
  if (previous && previous !== userId)
    removeLocalStorage(pendingPassRemovalsKey(previous));
}

export async function updateOwnedOfflinePasses(
  userId: string,
  update: (copy: unknown) => unknown,
): Promise<boolean> {
  let applied = false;
  await updateIndexedDbPair(
    OFFLINE_PASSES_OWNER_KEY,
    offlinePassesKey(userId),
    (owner, copy) => {
      if (asOwner(owner) !== userId) return {};
      const next = update(copy);
      applied = next !== undefined;
      return { secondary: next };
    },
  );
  return applied;
}

export async function clearOfflinePasses(): Promise<void> {
  revokeOfflineUser();
  const owner = await readOfflinePassesOwner().catch(() => null);
  if (owner) removeLocalStorage(pendingPassRemovalsKey(owner));
  await removeIndexedDbByPrefix(OFFLINE_PASSES_KEY_PREFIX);
  await removeIndexedDb(OFFLINE_PASSES_STORAGE_KEY).catch(() => {});
}
