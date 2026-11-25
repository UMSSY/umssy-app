import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { clearSharedLastActivity } from "@/shared/services/storage/session-activity-storage";
import { clearCurrentSessionUserId } from "@/shared/services/storage/session-user-id-storage";
import { clearSessionDrafts } from "./clear-session-drafts";
import { clearSessionMarker, setSessionMarker } from "./session-cookie";

export async function startSession(accessToken: string): Promise<void> {
  await clearSessionDrafts();
  if (!(await saveAccessToken(accessToken)))
    throw new Error("No se pudo guardar la sesión en este navegador");
  setSessionMarker();
}

export function endSession(): void {
  void clearSessionDrafts();
  clearAccessToken();
  clearCurrentSessionUserId();
  clearSharedLastActivity();
  clearSessionMarker();
}
