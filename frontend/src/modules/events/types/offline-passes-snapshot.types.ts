import type { OfflinePass } from "./offline-pass.types";

export interface OfflinePassesSnapshot {
  userId: string;
  savedAt: string;
  passes: OfflinePass[];
}
