import {
  SESSION_MARKER_COOKIE_NAME,
  SESSION_MARKER_COOKIE_VALUE,
} from "../constants/session.constants";
import { hasSessionMarker } from "@/shared/utils/session-marker";

function cookieAttributes(): string {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  return `; Path=/; SameSite=Lax${secure}`;
}

export function setSessionMarker(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_MARKER_COOKIE_NAME}=${SESSION_MARKER_COOKIE_VALUE}${cookieAttributes()}`;
}

export function clearSessionMarker(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_MARKER_COOKIE_NAME}=; Max-Age=0${cookieAttributes()}`;
}

export { hasSessionMarker };
