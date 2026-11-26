import {
  getCompanyCorrectionToken,
  removeCompanyCorrectionToken,
} from "./company-correction-token";

let currentToken: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeCompanyCorrectionToken(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCompanyCorrectionTokenSnapshot(): string | null {
  return currentToken;
}

export function captureCompanyCorrectionToken() {
  const found = getCompanyCorrectionToken(window.location.hash);
  if (!found) return;
  const { pathname, search, hash } = window.location;
  window.history.replaceState(
    window.history.state,
    "",
    `${pathname}${search}${removeCompanyCorrectionToken(hash)}`,
  );
  currentToken = found;
  emit();
}

export function discardCompanyCorrectionToken() {
  if (currentToken === null) return;
  currentToken = null;
  emit();
}
