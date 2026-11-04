import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { clearSessionDrafts } from "./clear-session-drafts";
import { clearSessionMarker, setSessionMarker } from "./session-cookie";

export function startSession(accessToken: string): void {
  void clearSessionDrafts();
  saveAccessToken(accessToken);
  setSessionMarker();
}

export function endSession(): void {
  void clearSessionDrafts();
  clearAccessToken();
  clearSessionMarker();
}
