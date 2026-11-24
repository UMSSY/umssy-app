import { BEARER_PREFIX } from "@/shared/constants/auth.constants";
import axios from "axios";
import { toast } from "sonner";
import { ENV_CONFIG } from "@/shared/config/env.config";
import {
  getAccessToken,
  clearAccessToken,
  initializeAccessTokenStorage,
} from "@/shared/services/storage/access-token-storage";

export const apiClient = axios.create({
  baseURL: ENV_CONFIG.apiUrl,
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
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const token = getAccessToken();
      const authorization = error.config?.headers?.get?.("Authorization");
      if (token && authorization === `${BEARER_PREFIX}${token}`)
        clearAccessToken();
    }
    return Promise.reject(error);
  },
);
