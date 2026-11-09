import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { clearSessionDrafts } from "./clear-session-drafts";
import { clearSessionMarker, setSessionMarker } from "./session-cookie";

export async function startSession(accessToken: string): Promise<void> {
  void clearSessionDrafts();
  if (!(await saveAccessToken(accessToken)))
    throw new Error("No se pudo guardar la sesión en este navegador");
  setSessionMarker();
}

export function endSession(): void {
  void clearSessionDrafts();
  clearAccessToken();
  clearSessionMarker();
}
