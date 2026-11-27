const MANUAL_LOGOUT_STORAGE_KEY = "umssy_manual_logout";

let pendingLogout: Promise<void> | null = null;
let isLoggedOutManually: boolean | undefined;
let sessionRestoreController = new AbortController();

export function hasRequestedManualLogout(): boolean {
  if (typeof window === "undefined") return false;
  if (isLoggedOutManually !== undefined) return isLoggedOutManually;

  try {
    isLoggedOutManually = sessionStorage.getItem(MANUAL_LOGOUT_STORAGE_KEY) === "1";
  } catch {
    isLoggedOutManually = false;
  }
  return isLoggedOutManually;
}

export function isManualLogoutInProgress(): boolean {
  return pendingLogout !== null;
}

export function getSessionRestoreSignal(): AbortSignal {
  return sessionRestoreController.signal;
}

export function clearManualLogout(): void {
  isLoggedOutManually = false;
  if (sessionRestoreController.signal.aborted) {
    sessionRestoreController = new AbortController();
  }
  try {
    sessionStorage.removeItem(MANUAL_LOGOUT_STORAGE_KEY);
  } catch {
    // El estado en memoria cubre navegadores con almacenamiento restringido.
  }
}

export function runManualLogout(logout: () => Promise<void>): Promise<void> {
  if (pendingLogout) return pendingLogout;

  isLoggedOutManually = true;
  sessionRestoreController.abort();
  try {
    sessionStorage.setItem(MANUAL_LOGOUT_STORAGE_KEY, "1");
  } catch {
    // El estado en memoria cubre navegadores con almacenamiento restringido.
  }
  pendingLogout = Promise.resolve()
    .then(logout)
    .finally(() => {
      pendingLogout = null;
    });
  return pendingLogout;
}
