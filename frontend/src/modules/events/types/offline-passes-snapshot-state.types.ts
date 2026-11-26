import type { OfflinePassesSnapshot } from "./offline-passes-snapshot.types";

export interface OfflinePassesSnapshotState {
  snapshot: OfflinePassesSnapshot | null;
  isLoading: boolean;
}
