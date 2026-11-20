function cookieAttributes(): string {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  return `; Path=/; SameSite=Lax${secure}`;
}

export function setSessionMarker(): void {
  if (typeof document === "undefined") return;
  document.cookie = `umssy_session=1${cookieAttributes()}`;
}

export function clearSessionMarker(): void {
  if (typeof document === "undefined") return;
  document.cookie = `umssy_session=; Max-Age=0${cookieAttributes()}`;
}

export function hasSessionMarker(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").includes(`umssy_session=1`);
}
