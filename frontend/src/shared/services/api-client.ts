import { BEARER_PREFIX } from "@/shared/constants/auth.constants";
import axios from "axios";
import { toast } from "sonner";
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
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const message = "Necesitas conexión para realizar esta acción.";
    if (config.method !== "get" && config.method !== "head")
      toast.info(message);
    throw new axios.AxiosError(message, "ERR_NETWORK", config);
  }
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

      const token = getAccessToken();
      const authorization = error.config?.headers?.get?.('Authorization');
      if (token && authorization === `${BEARER_PREFIX}${token}`)
        clearAccessToken();
    }
    return Promise.reject(error);
  },
);
