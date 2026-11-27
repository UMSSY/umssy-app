import axios from "axios";
import { ENV_CONFIG } from "@/shared/config/env.config";
import {
  getSessionRestoreSignal,
  hasRequestedManualLogout,
} from "@/shared/utils/manual-logout";
import { setSessionMarker } from "@/shared/utils/session-marker";
import { saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { markCookieSessionActive } from "@/shared/services/storage/cookie-session-state";

export const REFRESH_LOCK_NAME = "umssy_auth_refresh";
export const LAST_REFRESH_STORAGE_KEY = "umssy_last_refresh_timestamp";

let inFlightRefreshPromise: Promise<boolean> | null = null;

export interface SharedRefreshOptions {
  wait?: boolean;
}

function notifySessionRefreshed(): void {
  if (typeof window !== "undefined" && typeof window.BroadcastChannel !== "undefined") {
    try {
      const channel = new BroadcastChannel("umssy_auth");
      channel.postMessage({ type: "SESSION_REFRESHED" });
      channel.close();
    } catch {
      return;
    }
  }
}

export async function applyRefreshedSessionCredential(
  resData: unknown,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) return;

  const payload = resData as {
    data?: { accessToken?: string };
    accessToken?: string;
  } | undefined;
  const newToken = payload?.data?.accessToken || payload?.accessToken;
  if (newToken) {
    await saveAccessToken(newToken);
  } else {
    markCookieSessionActive();
  }
  if (!signal.aborted) setSessionMarker();
}

export async function performRefreshRequest(signal: AbortSignal): Promise<void> {
  const response = await axios.post(
    `${ENV_CONFIG.apiUrl || ""}/auth/refresh`,
    {},
    { withCredentials: true, signal },
  );
  await applyRefreshedSessionCredential(response.data, signal);
}

export async function executeSharedRefresh(
  performRefresh: (signal: AbortSignal) => Promise<unknown> = performRefreshRequest,
  options?: SharedRefreshOptions,
): Promise<boolean> {
  if (hasRequestedManualLogout()) return false;

  const signal = getSessionRestoreSignal();
  const shouldWait = options?.wait ?? false;

  if (inFlightRefreshPromise) {
    try {
      return await inFlightRefreshPromise;
    } catch {
      return false;
    }
  }

  const runRefresh = async (): Promise<boolean> => {
    if (signal.aborted) return false;
    try {
      await performRefresh(signal);
      if (signal.aborted) return false;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LAST_REFRESH_STORAGE_KEY, String(Date.now()));
        } catch {
          // Local storage may be unavailable in restricted contexts
        }
      }
      notifySessionRefreshed();
      return true;
    } catch {
      return false;
    }
  };

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.locks?.request === "function"
  ) {
    inFlightRefreshPromise = new Promise<boolean>((resolve) => {
      const lockOptions = shouldWait ? {} : { ifAvailable: true };

      navigator.locks.request(
        REFRESH_LOCK_NAME,
        lockOptions,
        async (lock) => {
          if (!lock || signal.aborted) {
            resolve(false);
            return;
          }

          if (shouldWait && typeof window !== "undefined") {
            try {
              const lastRefresh = Number(
                localStorage.getItem(LAST_REFRESH_STORAGE_KEY) || "0",
              );
              if (Date.now() - lastRefresh < 3000) {
                resolve(true);
                return;
              }
            } catch {}
          }

          const success = await runRefresh();
          resolve(success);
        },
      ).catch(() => resolve(false));
    }).finally(() => {
      inFlightRefreshPromise = null;
    });

    return inFlightRefreshPromise;
  }

  inFlightRefreshPromise = (async () => {
    try {
      return await runRefresh();
    } finally {
      inFlightRefreshPromise = null;
    }
  })();

  return inFlightRefreshPromise;
}
