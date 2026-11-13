import { OFFLINE_PASSES_STALE_AFTER_MS } from "../constants/offline-passes.constants";

export function isSnapshotStale(savedAt: string, now: number): boolean {
  const time = Date.parse(savedAt);
  return Number.isNaN(time) || now - time > OFFLINE_PASSES_STALE_AFTER_MS;
}
