import {
  readIndexedDb,
  removeIndexedDb,
  writeIndexedDb,
} from "./browser-indexed-db";

const SESSION_USER_ID_KEY = "umssy:session:current-user-id";

let inMemoryUserId: string | null = null;
let pendingWrites: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function setCurrentSessionUserId(userId: string | null): void {
  const changed = inMemoryUserId !== userId;
  inMemoryUserId = userId;
  if (changed) emit();

  const op = pendingWrites.then(async () => {
    if (userId) {
      await writeIndexedDb(SESSION_USER_ID_KEY, userId).catch(() => {});
    } else {
      await removeIndexedDb(SESSION_USER_ID_KEY).catch(() => {});
    }
  });
  pendingWrites = op.catch(() => {});
}

export function getCurrentSessionUserId(): string | null {
  return inMemoryUserId;
}

export async function readCurrentSessionUserId(): Promise<string | null> {
  if (inMemoryUserId) return inMemoryUserId;
  try {
    const stored = await readIndexedDb<unknown>(SESSION_USER_ID_KEY);
    if (typeof stored === "string" && stored.length > 0) {
      inMemoryUserId = stored;
      emit();
      return stored;
    }
  } catch {
    return null;
  }
  return null;
}

export function clearCurrentSessionUserId(): void {
  setCurrentSessionUserId(null);
}

export function subscribeSessionUserId(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export async function waitForSessionUserIdWrites(): Promise<void> {
  await pendingWrites;
}
