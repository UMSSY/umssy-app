import { canUseLocalStorage, removeLocalStorage } from "@/shared/services/storage/browser-local-storage";
import { SESSION_DRAFT_STORAGE_PREFIX } from "../constants/session.constants";

export function clearSessionDrafts(): void {
  if (!canUseLocalStorage()) return;
  const draftKeys = Object.keys(window.localStorage).filter((key) => key.startsWith(SESSION_DRAFT_STORAGE_PREFIX));
  draftKeys.forEach((key) => removeLocalStorage(key));
}
