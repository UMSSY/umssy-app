import { readIndexedDb, removeIndexedDb, writeIndexedDb } from "./browser-indexed-db";

const SESSION_USER_ID_STORAGE_KEY = "umssy_current_user_id";

let inMemoryUserId: string | null = null;
let hydration: Promise<void> | null = null;

export function initializeSessionUserId(): Promise<void> {
  if (hydration) return hydration;
  hydration = readIndexedDb<string>(SESSION_USER_ID_STORAGE_KEY)
    .then((stored) => {
      if (!inMemoryUserId && typeof stored === "string" && stored) {
        inMemoryUserId = stored;
      }
    })
    .catch(() => {});
  return hydration;
}

export function setCurrentSessionUserId(userId: string | null): void {
  inMemoryUserId = userId;
  if (userId) {
    void writeIndexedDb(SESSION_USER_ID_STORAGE_KEY, userId).catch(() => {});
    return;
  }
  void removeIndexedDb(SESSION_USER_ID_STORAGE_KEY).catch(() => {});
}

export function getCurrentSessionUserId(): string | null {
  if (!inMemoryUserId) void initializeSessionUserId();
  return inMemoryUserId;
}

export function clearCurrentSessionUserId(): void {
  setCurrentSessionUserId(null);
}
