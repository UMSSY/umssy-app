export interface PushSyncSession {
  token?: string | null;
  signal: AbortSignal;
}
