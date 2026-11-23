import type { OfflinePass } from "./offline-pass.types";
import type { OfflinePassesSnapshot } from "./offline-passes-snapshot.types";

export interface OfflinePassesStore {
  save(userId: string, passes: OfflinePass[]): Promise<void>;
  load(userId: string): Promise<OfflinePassesSnapshot | null>;
  clearUser(userId: string): Promise<void>;
  clearAll(): Promise<void>;
}
