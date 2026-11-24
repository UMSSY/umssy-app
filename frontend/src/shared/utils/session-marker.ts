export const SESSION_MARKER_COOKIE_NAME = "umssy_session";
export const SESSION_MARKER_COOKIE_VALUE = "1";

export function hasSessionMarker(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .includes(`${SESSION_MARKER_COOKIE_NAME}=${SESSION_MARKER_COOKIE_VALUE}`);
}
