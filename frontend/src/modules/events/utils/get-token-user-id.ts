export function getTokenUserId(accessToken: string | null): string | null {
  if (!accessToken) return null;
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const decoded: unknown = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof decoded !== "object" || decoded === null) return null;
    const { sub } = decoded as Record<string, unknown>;
    return typeof sub === "string" && sub.trim() ? sub : null;
  } catch {
    return null;
  }
}
