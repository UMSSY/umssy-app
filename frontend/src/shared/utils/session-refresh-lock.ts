import axios from "axios";
import { ENV_CONFIG } from "@/shared/config/env.config";
import { saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { markCookieSessionActive } from "@/shared/services/storage/cookie-session-state";

export const REFRESH_LOCK_NAME = "umssy_auth_refresh";
export const LAST_REFRESH_STORAGE_KEY = "umssy_last_refresh_timestamp";

let inFlightRefreshPromise: Promise<boolean> | null = null;

export interface SharedRefreshOptions {
  /**
   * Si es true, espera a adquirir el Web Lock si otra pestaña lo tiene ocupado
   * (usado por el interceptor 401 para reintentar la petición una vez termine el refresh).
   * Si es false, retorna inmediatamente false si el candado está ocupado (usado por el temporizador de inactividad).
   */
  wait?: boolean;
}

function notifySessionRefreshed(): void {
  if (typeof window !== "undefined" && typeof window.BroadcastChannel !== "undefined") {
    try {
      const channel = new BroadcastChannel("umssy_auth");
      channel.postMessage({ type: "SESSION_REFRESHED" });
      channel.close();
    } catch {
      // Ignorar fallo de BroadcastChannel
    }
  }
}

async function defaultPerformRefresh(): Promise<void> {
  const response = await axios.post(
    `${ENV_CONFIG.apiUrl || ""}/auth/refresh`,
    {},
    { withCredentials: true },
  );
  const resData = response.data as {
    data?: { accessToken?: string };
    accessToken?: string;
  };
  const newToken = resData?.data?.accessToken || resData?.accessToken;
  if (newToken) {
    await saveAccessToken(newToken);
  } else {
    markCookieSessionActive();
  }
}

/**
 * Ejecuta un refresh coordinado entre pestañas usando Web Locks y una promesa única local.
 * - En la misma pestaña: previene peticiones concurrentes compartiendo la promesa en curso.
 * - Entre pestañas:
 *   - Con wait=true: espera a que la otra pestaña termine, y si la otra pestaña ya renovó el token
 *     hace menos de 3 segundos, no vuelve a llamar al backend y retorna true directamente.
 *   - Con wait=false: no espera y retorna false inmediatamente si otra pestaña ya está renovando.
 */
export async function executeSharedRefresh(
  performRefresh?: () => Promise<unknown>,
  options?: SharedRefreshOptions,
): Promise<boolean> {
  const shouldWait = options?.wait ?? false;

  // 1. Evitar llamadas duplicadas concurrentes en la misma pestaña
  if (inFlightRefreshPromise) {
    try {
      return await inFlightRefreshPromise;
    } catch {
      return false;
    }
  }

  const runRefresh = async (): Promise<boolean> => {
    try {
      if (performRefresh) {
        await performRefresh();
      } else {
        await defaultPerformRefresh();
      }
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LAST_REFRESH_STORAGE_KEY, String(Date.now()));
        } catch {
          // ignore storage error
        }
      }
      notifySessionRefreshed();
      return true;
    } catch {
      return false;
    }
  };

  // 2. Web Locks API para coordinación entre pestañas
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
          if (!lock) {
            // Con ifAvailable=true, otra pestaña ya tiene el candado
            resolve(false);
            return;
          }

          // Si tuvimos que esperar al candado (wait=true), verificar si la otra pestaña
          // ya renovó el token exitosamente recientemente (en los últimos 3 segundos).
          if (shouldWait && typeof window !== "undefined") {
            try {
              const lastRefresh = Number(
                localStorage.getItem(LAST_REFRESH_STORAGE_KEY) || "0",
              );
              if (Date.now() - lastRefresh < 3000) {
                // Ya fue renovado por la otra pestaña mientras esperábamos el candado
                resolve(true);
                return;
              }
            } catch {
              // Si falla leer localStorage, proceder a refrescar
            }
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

  // 3. Fallback cuando Web Locks no está disponible
  inFlightRefreshPromise = (async () => {
    try {
      return await runRefresh();
    } finally {
      inFlightRefreshPromise = null;
    }
  })();

  return inFlightRefreshPromise;
}
