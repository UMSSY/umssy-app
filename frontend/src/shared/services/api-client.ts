import { BEARER_PREFIX } from "@/shared/constants/auth.constants";
import axios from "axios";
import { ENV_CONFIG } from "@/shared/config/env.config";
import {
  getAccessToken,
  clearAccessToken,
  initializeAccessTokenStorage,
} from "@/shared/services/storage/access-token-storage";
import { broadcastAuthEvent } from "@/shared/utils/auth-broadcast";
import { executeSharedRefresh } from "@/shared/utils/session-refresh-lock";

export const apiClient = axios.create({
  baseURL: ENV_CONFIG.apiUrl,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  await initializeAccessTokenStorage();
  const accessToken = getAccessToken();

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
      const responseCode = (error.response?.data as { code?: string } | undefined)?.code;

      // 1. Si el 401 trae un código explícito de sesión terminada (CA7)
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

      // 2. 401 sin code: intentar un refresh y reintentar la petición una vez
      const originalRequest = error.config as (typeof error.config & { _retry?: boolean });
      const url = originalRequest?.url || "";
      const isAuthUrl =
        url.includes("/auth/login") ||
        url.includes("/auth/refresh") ||
        url.includes("/auth/logout");

      if (originalRequest && !originalRequest._retry && !isAuthUrl) {
        originalRequest._retry = true;
        try {
          const success = await executeSharedRefresh(undefined, { wait: true });
          if (!success) {
            throw new Error("No se pudo renovar la sesión");
          }
          const newToken = getAccessToken();
          if (newToken && originalRequest.headers) {
            if (typeof originalRequest.headers.set === "function") {
              originalRequest.headers.set("Authorization", `${BEARER_PREFIX}${newToken}`);
            } else {
              (originalRequest.headers as Record<string, string>)["Authorization"] = `${BEARER_PREFIX}${newToken}`;
            }
          }
          return apiClient(originalRequest);
        } catch {
          const token = getAccessToken();
          const authorization = originalRequest.headers?.get?.("Authorization");
          if (token && authorization === `${BEARER_PREFIX}${token}`) {
            clearAccessToken();
          }
          return Promise.reject(error);
        }
      }

      // 3. Si ya fue reintentada o falló el refresh, invalidar la sesión actual
      const token = getAccessToken();
      const authorization = error.config?.headers?.get?.("Authorization");
      if (token && authorization === `${BEARER_PREFIX}${token}`)
        clearAccessToken();
    }
    return Promise.reject(error);
  },
);
