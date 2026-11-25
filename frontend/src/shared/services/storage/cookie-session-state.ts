let cookieSessionActive = false;
let lastSessionSubject: string | null = null;
let bearerTokenClearer: (() => void) | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function registerBearerTokenClearer(clearer: () => void): void {
  bearerTokenClearer = clearer;
}

export function hasCookieSession(): boolean {
  return cookieSessionActive;
}

export function markCookieSessionActive(): void {
  cookieSessionActive = true;
  bearerTokenClearer?.();
  emit();
}

export function clearCookieSessionState(): void {
  const changed = cookieSessionActive || lastSessionSubject !== null;
  cookieSessionActive = false;
  lastSessionSubject = null;
  if (changed) emit();
}

export function setCookieSessionSubject(subject: string | null): void {
  cookieSessionActive = false;
  lastSessionSubject = subject;
  emit();
}

export function getCookieSessionSubject(): string | null {
  return lastSessionSubject;
}

export function subscribeCookieSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
