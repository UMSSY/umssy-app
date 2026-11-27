import { AUTH_LOGOUT_PATH, BEARER_PREFIX } from "@/shared/constants/auth.constants";
import axios from "axios";
import { toast } from "sonner";
import { ENV_CONFIG } from "@/shared/config/env.config";
import {
  clearAccessToken,
  getAccessToken,
  initializeAccessTokenStorage,
} from "@/shared/services/storage/access-token-storage";
import {
  hasCookieSession,
  markCookieSessionActive,
} from "@/shared/services/storage/cookie-session-state";
import { broadcastAuthEvent } from "@/shared/utils/auth-broadcast";
import { hasRequestedManualLogout } from "@/shared/utils/manual-logout";
import { executeSharedRefresh } from "@/shared/utils/session-refresh-lock";

function isJwtExpired(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return false;
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized)) as { exp?: unknown };
    return typeof payload.exp === "number" && Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
}

function readAuthorizationHeader(headers: unknown): string | undefined {
  if (!headers || typeof headers !== "object") return undefined;
  const record = headers as {
    get?: (name: string) => unknown;
    Authorization?: unknown;
    authorization?: unknown;
  };
  const raw =
    typeof record.get === "function"
      ? record.get("Authorization")
      : (record.Authorization ?? record.authorization);
  return typeof raw === "string" ? raw : undefined;
}

function setAuthorizationHeader(headers: unknown, value: string): void {
  if (!headers || typeof headers !== "object") return;
  const record = headers as {
    set?: (name: string, val: string) => void;
    Authorization?: string;
  };
  if (typeof record.set === "function") {
    record.set("Authorization", value);
  } else {
    record.Authorization = value;
  }
}

function deleteAuthorizationHeader(headers: unknown): void {
  if (!headers || typeof headers !== "object") return;
  const record = headers as {
    delete?: (name: string) => void;
    Authorization?: string;
    authorization?: string;
  };
  if (typeof record.delete === "function") {
    record.delete("Authorization");
    record.delete("authorization");
  } else {
    delete record.Authorization;
    delete record.authorization;
  }
}

export const apiClient = axios.create({
  baseURL: ENV_CONFIG.apiUrl,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const message = "Necesitas conexión para realizar esta acción.";
    if (config.method !== "get" && config.method !== "head")
      toast.info(message);
    throw new axios.AxiosError(message, "ERR_NETWORK", config);
  }
  if (config.url === AUTH_LOGOUT_PATH) return config;

  await initializeAccessTokenStorage();
  const accessToken = getAccessToken();

  if (accessToken && isJwtExpired(accessToken)) {
    if (!hasRequestedManualLogout()) markCookieSessionActive();
    if (config.headers.get("Authorization") === "") {
      config.headers.delete("Authorization");
    }
    return config;
  }

  if (config.headers.get("Authorization") === "") {
    config.headers.delete("Authorization");
  }

  if (accessToken && !config.headers.has("Authorization")) {
    config.headers.set("Authorization", `${BEARER_PREFIX}${accessToken}`);
  }

  return config;
});

export const isApiError = axios.isAxiosError;

export { AxiosError as ApiError } from "axios";

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (error.config?.url === AUTH_LOGOUT_PATH || hasRequestedManualLogout()) {
        return Promise.reject(error);
      }

      const responseCode = (error.response?.data as { code?: string } | undefined)?.code;

      if (
        responseCode === "SESSION_EXPIRED" ||
        responseCode === "SESSION_REVOKED" ||
        responseCode === "REFRESH_INVALID" ||
        responseCode === "PASSWORD_CHANGED"
      ) {
        clearAccessToken();
        broadcastAuthEvent({ type: "SESSION_CLOSED", reason: responseCode });
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/session-closed") &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.replace(`/session-closed?reason=${responseCode}`);
        }
        return Promise.reject(error);
      }

      const originalRequest = error.config as (typeof error.config & { _retry?: boolean });
      const url = originalRequest?.url || "";
      const isAuthUrl =
        url.includes("/auth/login") ||
        url.includes("/auth/refresh");

      if (originalRequest && !originalRequest._retry && !isAuthUrl) {
        originalRequest._retry = true;
        const previousAuthorization = readAuthorizationHeader(originalRequest.headers);
        try {
          const success = await executeSharedRefresh(undefined, { wait: true });
          if (!success) {
            throw new Error("No se pudo renovar la sesión");
          }
          const previousToken =
            typeof previousAuthorization === "string"
              ? previousAuthorization.replace(BEARER_PREFIX, "")
              : null;
          deleteAuthorizationHeader(originalRequest.headers);
          const newToken = getAccessToken();
          if (
            newToken &&
            !isJwtExpired(newToken) &&
            newToken !== previousToken &&
            originalRequest.headers
          ) {
            setAuthorizationHeader(originalRequest.headers, `${BEARER_PREFIX}${newToken}`);
          }
          return apiClient(originalRequest);
        } catch {
          const token = getAccessToken();
          if (
            (token && previousAuthorization === `${BEARER_PREFIX}${token}`) ||
            (!previousAuthorization && hasCookieSession())
          ) {
            clearAccessToken();
          }
          return Promise.reject(error);
        }
      }

      const token = getAccessToken();
      const authorization = readAuthorizationHeader(error.config?.headers);
      if (
        (token && authorization === `${BEARER_PREFIX}${token}`) ||
        (!authorization && hasCookieSession())
      ) {
        clearAccessToken();
      }
    }
    return Promise.reject(error);
  },
);
