import { isApiError } from "@/shared/services/api-client";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";

type Preferences = { technicalAreaIds: string[]; orientationTypeIds: string[] };
type SavedIntention = { subject: string; fingerprint: string; key: string };
const memory = new Map<string, SavedIntention>();

function currentSubject(): string {
  try {
    const payload = getAccessToken()?.split(".")[1];
    if (!payload) return "anonymous";
    const subject = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).sub;
    return typeof subject === "string" ? subject : "anonymous";
  } catch { return "anonymous"; }
}

export async function withMentorIntakeKey<T>(operation: "activate" | "request", preferences: Preferences, submit: (key: string) => Promise<T>): Promise<T> {
  const name = `hu7:intake:${operation}`;
  const subject = currentSubject();
  const fingerprint = JSON.stringify({ technicalAreaIds: [...preferences.technicalAreaIds].sort(), orientationTypeIds: [...preferences.orientationTypeIds].sort() });
  let storage: Storage | null = null;
  let saved = memory.get(name);
  try {
    storage = typeof window === "undefined" ? null : window.sessionStorage;
    const value = storage?.getItem(name);
    if (value) saved = JSON.parse(value);
  } catch { /* Storage may be unavailable; retain the intention in memory. */ }
  const key = saved?.subject === subject && saved.fingerprint === fingerprint ? saved.key : crypto.randomUUID();
  const intention = { subject, fingerprint, key };
  memory.set(name, intention);
  try { storage?.setItem(name, JSON.stringify(intention)); } catch { /* Memory fallback above. */ }
  const clear = () => {
    if (memory.get(name)?.key === key) memory.delete(name);
    try {
      if (JSON.parse(storage?.getItem(name) ?? "null")?.key === key) storage?.removeItem(name);
    } catch { /* Clearing storage must not turn a successful request into failure. */ }
  };
  try {
    const result = await submit(key);
    clear();
    return result;
  } catch (error) {
    // An ambiguous network/5xx result must be replayed with the same UUID,
    // including after closing and reopening the form in this browser session.
    if (isApiError(error) && error.response && error.response.status < 500) clear();
    throw error;
  }
}
