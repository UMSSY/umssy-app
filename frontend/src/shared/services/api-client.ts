import { BEARER_PREFIX } from "@/shared/constants/auth.constants";
import axios from "axios";
import { ENV_CONFIG } from "@/shared/config/env.config";
import {
  getAccessToken,
  clearAccessToken,
  initializeAccessTokenStorage,
} from "@/shared/services/storage/access-token-storage";
import { broadcastAuthEvent } from "@/shared/utils/auth-broadcast";

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
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const token = getAccessToken();
      const authorization = error.config?.headers?.get?.("Authorization");
      // Una respuesta tardía de otra sesión no debe invalidar el token actual.
      if (token && authorization === `${BEARER_PREFIX}${token}`)
        clearAccessToken();

      const responseCode = (error.response?.data as { code?: string } | undefined)?.code;
      if (
        responseCode === "SESSION_EXPIRED" ||
        responseCode === "SESSION_REVOKED" ||
        responseCode === "REFRESH_INVALID" ||
        responseCode === "PASSWORD_CHANGED"
      ) {
        broadcastAuthEvent({ type: "SESSION_CLOSED", reason: responseCode });
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/session-closed") &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.replace(`/session-closed?reason=${responseCode}`);
        }
      }
    }
    return Promise.reject(error);
  },
);
