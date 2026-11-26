import {
  readLocalStorage,
  removeLocalStorage,
  writeLocalStorage,
} from "./browser-local-storage";

export const SESSION_LAST_ACTIVITY_KEY = "umssy_last_activity_at";

export function readSharedLastActivity(): number | null {
  const raw = readLocalStorage(SESSION_LAST_ACTIVITY_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function writeSharedLastActivity(timestamp: number): void {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return;
  const normalized = Math.trunc(timestamp);
  const current = readSharedLastActivity();
  if (current !== null && normalized <= current) return;
  writeLocalStorage(SESSION_LAST_ACTIVITY_KEY, String(normalized));
}

export function clearSharedLastActivity(): void {
  removeLocalStorage(SESSION_LAST_ACTIVITY_KEY);
}
