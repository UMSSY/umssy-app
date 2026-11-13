import type { Registration } from "./registration.types";
import type { PassesViewStatus } from "./passes-view-status.types";

export interface PassesViewState {
  status: PassesViewStatus;
  isOnline: boolean;
  passes: Registration[];
  offlineQrTokens: Record<string, string>;
  lastUpdated: string | null;
  isStale: boolean;
  error: string | null;
  isConnectionError: boolean;
  retry: () => void;
}
