import { OFFLINE_PASSES_ACTIVE_USER_KEY } from '@/shared/constants/offline-passes.constants';
import {
  readLocalStorage,
  removeLocalStorage,
  writeLocalStorage,
} from './browser-local-storage';

export function readActiveOfflineUser(): string | null {
  const value = readLocalStorage(OFFLINE_PASSES_ACTIVE_USER_KEY);
  return value && value.trim() ? value : null;
}

export function activateOfflineUser(userId: string): void {
  if (readActiveOfflineUser() !== userId)
    writeLocalStorage(OFFLINE_PASSES_ACTIVE_USER_KEY, userId);
}

export function revokeOfflineUser(): void {
  removeLocalStorage(OFFLINE_PASSES_ACTIVE_USER_KEY);
}
