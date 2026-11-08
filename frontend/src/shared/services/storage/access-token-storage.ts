import { ACCESS_TOKEN_STORAGE_KEY } from "@/shared/constants/auth.constants";
import { readLocalStorage, writeLocalStorage } from "./browser-local-storage";
import {
  readSessionStorage,
  removeSessionStorage,
  writeSessionStorage,
} from "./browser-session-storage";

const LOGOUT_KEY = "umssy-session-logout";
const SESSION_LOGOUT_KEY = "sessionLogoutVersion";

function logoutVersion(): string {
  return readLocalStorage(LOGOUT_KEY) ?? '';
}

export function saveAccessToken(accessToken: string): boolean {
  const isSaved = writeSessionStorage(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  if (isSaved) writeSessionStorage(SESSION_LOGOUT_KEY, logoutVersion());
  if (isSaved && typeof window !== "undefined") window.dispatchEvent(new Event("access-token-change"));
  return isSaved;
}

export function getAccessToken(): string | null {
  const token = readSessionStorage(ACCESS_TOKEN_STORAGE_KEY);
  if (token && typeof window !== "undefined" && (readSessionStorage(SESSION_LOGOUT_KEY) ?? '') !== logoutVersion()) return null;
  return token;
}

export function clearAccessToken(): boolean {
  const hadToken = Boolean(getAccessToken());
  const isRemoved = removeSessionStorage(ACCESS_TOKEN_STORAGE_KEY);
  if (hadToken && isRemoved && typeof window !== "undefined") {
    try { writeLocalStorage(LOGOUT_KEY, crypto.randomUUID()); } catch { /* Logout must still finish if UUID generation is unavailable. */ }
  }
  if (isRemoved && typeof window !== "undefined") window.dispatchEvent(new Event("access-token-change"));
  return isRemoved;
}

export function subscribeAccessToken(onChange: () => void): () => void {
  window.addEventListener("access-token-change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("access-token-change", onChange);
    window.removeEventListener("storage", onChange);
  };
}
