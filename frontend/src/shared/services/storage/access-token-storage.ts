import { ACCESS_TOKEN_STORAGE_KEY } from "@/shared/constants/auth.constants";
import {
  readIndexedDb,
  writeIndexedDb,
  removeIndexedDb,
} from "./browser-indexed-db";

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

export function isAccessTokenReady(): boolean {
  return ready;
}
export function initializeAccessTokenStorage(): Promise<void> {
  if (ready) return Promise.resolve();
  if (loading) return loading;
  const currentRevision = revision;
  loading = readIndexedDb<unknown>(ACCESS_TOKEN_STORAGE_KEY)
    .then((stored) => {
      if (revision === currentRevision)
        token = typeof stored === "string" ? stored : null;
    })
    .catch(() => {
      if (revision === currentRevision) token = null;
    })
    .finally(() => {
      if (revision !== currentRevision) return;
      ready = true;
      loading = null;
      emit();
    });
  return loading;
}

export async function saveAccessToken(value: string): Promise<boolean> {
  const writeRevision = ++revision;
  const operation = writes.then(() =>
    writeIndexedDb(ACCESS_TOKEN_STORAGE_KEY, value),
  );
  writes = operation.catch(() => {});
  try {
    await operation;
  } catch {
    if (revision === writeRevision) {
      ready = true;
      loading = null;
      emit();
    }
    return false;
  }
  if (revision !== writeRevision) return false;
  token = value;
  ready = true;
  emit();
  channel?.postMessage("changed");
  return true;
}

export function getAccessToken(): string | null {
  return token;
}

export function clearAccessToken(): boolean {
  revision++;
  token = null;
  ready = true;
  loading = null;
  emit();
  const operation = writes.then(() =>
    removeIndexedDb(ACCESS_TOKEN_STORAGE_KEY),
  );
  writes = operation.catch(() => {});
  void operation.then(() => channel?.postMessage("changed")).catch(() => {});
  return true;
}

export function subscribeAccessToken(onChange: () => void): () => void {
  listeners.add(onChange);
  if (
    typeof window !== "undefined" &&
    typeof BroadcastChannel !== "undefined" &&
    !channel
  ) {
    channel = new BroadcastChannel("umssy-session");
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
