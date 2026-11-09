import { NEXT_PARAM } from "../constants/session.constants";

const BASE_ORIGIN = "http://localhost";
const UNSAFE_CHARACTERS = /[\u0000-\u001f\u007f\\]/;

export function getSafeNextPath(value: string | null | undefined): string | null {
  if (!value || value.length > 300) return null;
  if (!value.startsWith("/") || value.startsWith("//") || UNSAFE_CHARACTERS.test(value)) return null;
  try {
    const url = new URL(value, BASE_ORIGIN);
    if (url.origin !== BASE_ORIGIN) return null;
    if (url.pathname === "/" || url.pathname === "/login" || url.pathname.startsWith(`/login/`)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function buildLoginUrl(path: string | null | undefined): string {
  const next = getSafeNextPath(path);
  return next ? `/login?${NEXT_PARAM}=${encodeURIComponent(next)}` : "/login";
}
