import { pendingPassRemovalsKey } from '@/shared/constants/offline-passes.constants';
import {
  readLocalStorage,
  removeLocalStorage,
  writeLocalStorage,
} from './browser-local-storage';

export function readPendingPassRemovals(userId: string): string[] {
  const raw = readLocalStorage(pendingPassRemovalsKey(userId));
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

export function addPendingPassRemoval(userId: string, registrationId: string): void {
  const pending = readPendingPassRemovals(userId);
  if (pending.includes(registrationId)) return;
  writeLocalStorage(
    pendingPassRemovalsKey(userId),
    JSON.stringify([...pending, registrationId]),
  );
}

export function clearPendingPassRemovals(userId: string, registrationIds: string[]): void {
  const remaining = readPendingPassRemovals(userId).filter(
    (id) => !registrationIds.includes(id),
  );
  if (remaining.length === 0) {
    removeLocalStorage(pendingPassRemovalsKey(userId));
    return;
  }
  writeLocalStorage(pendingPassRemovalsKey(userId), JSON.stringify(remaining));
}
