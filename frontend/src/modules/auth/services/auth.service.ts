import { toAuthRequestError } from "../utils/auth-request-error";
import { BEARER_PREFIX } from "@/shared/constants/auth.constants";
import { ROLE_TAGS } from "@/shared/constants/roles.constants";
import { apiClient } from "@/shared/services/api-client";
import { broadcastAuthEvent } from "../utils/auth-broadcast";
import {
  applyRefreshedSessionCredential,
  executeSharedRefresh,
  type SharedRefreshOptions,
} from "../utils/session-refresh-lock";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { SessionResponse } from "../types/session-response.types";
import type { LoginPayload, LoginResponse } from "../types/auth-types";
import type {
  RequestResetCodePayload,
  VerifyResetCodePayload,
  ResetPasswordPayload,
} from "../types/forgot-password.types";
import { withOfflineSessionCopy } from "@/shared/services/storage/offline-session-copy";

function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== "object" || value === null) return false;
  const { accessToken, roleTag, roles } = value as Record<string, unknown>;
  return typeof accessToken === "string" && accessToken !== ""
    && ROLE_TAGS.some((role) => role === roleTag)
    && (roles === undefined || (Array.isArray(roles) && roles.length > 0 && roles.every((role) => ROLE_TAGS.some((knownRole) => knownRole === role))));
}

function extractLoginResponse(body: unknown): LoginResponse {
  const wrapped = typeof body === "object" && body !== null ? (body as { data?: unknown }).data : undefined;
  const candidate = isLoginResponse(wrapped) ? wrapped : body;
  if (!isLoginResponse(candidate)) {
    throw new Error("El backend no devolvió un token de sesión válido.");
  }
  return { accessToken: candidate.accessToken, roleTag: candidate.roleTag, ...(candidate.roles ? { roles: candidate.roles } : {}) };
}

function extractApiError(err: unknown, fallback: string): never {
  throw toAuthRequestError(err, fallback);
}

export const authService = {
  getSession: async (accessToken?: string | null, signal?: AbortSignal, requireStorage = false): Promise<SessionResponse> => {
    return withOfflineSessionCopy("auth-session", accessToken, async () => {
      const response = await apiClient.get<ApiResponse<SessionResponse>>("/auth/session", {
        signal,
        timeout: 15_000,
        headers: accessToken ? { Authorization: `${BEARER_PREFIX}${accessToken}` } : undefined,
      });
      return response.data.data;
    }, { signal, requireStorage });
  },
  refreshSession: async (options?: SharedRefreshOptions): Promise<{ ok: boolean }> => {
    const refreshed = await executeSharedRefresh(
      async () => {
        const response = await apiClient.post<
          ApiResponse<{ ok?: boolean; accessToken?: string }> | { ok?: boolean; accessToken?: string }
        >("/auth/refresh");
        await applyRefreshedSessionCredential(response.data);
        return response.data;
      },
      { wait: options?.wait ?? true },
    );
    if (!refreshed) {
      throw new Error("No se pudo renovar la sesión");
    }
    return { ok: true };
  },
  logout: async (): Promise<{ ok: boolean }> => {
    broadcastAuthEvent({ type: "SESSION_CLOSED", reason: "SESSION_REVOKED" });
    try {
      const response = await apiClient.post<ApiResponse<{ ok: boolean }> | { ok: boolean }>("/auth/logout");
      const res = response.data;
      if (res && typeof res === "object" && "data" in res && res.data) {
        return res.data;
      }
      return (res as { ok: boolean }) ?? { ok: true };
    } catch {
      return { ok: true };
    }
  },
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    if (!apiClient.defaults.baseURL) {
      throw new Error("La URL del backend no está configurada. Revisa las variables NEXT_PUBLIC_API_URL del frontend.");
    }
    const response = await apiClient.post<unknown>("/auth/login", payload);
    return extractLoginResponse(response.data);
  },
  requestPasswordResetCode: async (payload: RequestResetCodePayload): Promise<{ ok: boolean; message?: string }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ ok: boolean; message: string }> | { ok: boolean; message: string }>(
        "/auth/forgot-password/request",
        payload
      );
      const res = response.data;
      if (res && typeof res === "object" && "data" in res && res.data) {
        return res.data;
      }
      return (res as { ok: boolean; message?: string }) ?? { ok: true };
    } catch (err: unknown) {
      extractApiError(err, "Error al solicitar el código de recuperación.");
    }
  },
  verifyPasswordResetCode: async (payload: VerifyResetCodePayload): Promise<{ ok: boolean; message?: string }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ ok: boolean; message: string }> | { ok: boolean; message: string }>(
        "/auth/forgot-password/verify",
        payload
      );
      const res = response.data;
      if (res && typeof res === "object" && "data" in res && res.data) {
        return res.data;
      }
      return (res as { ok: boolean; message?: string }) ?? { ok: true };
    } catch (err: unknown) {
      extractApiError(err, "El código de verificación es incorrecto o ha expirado.");
    }
  },
  resetPassword: async (payload: ResetPasswordPayload): Promise<{ ok: boolean; message?: string }> => {
    try {
      const response = await apiClient.post<ApiResponse<{ ok: boolean; message: string }> | { ok: boolean; message: string }>(
        "/auth/forgot-password/reset",
        payload
      );
      const res = response.data;
      if (res && typeof res === "object" && "data" in res && res.data) {
        return res.data;
      }
      return (res as { ok: boolean; message?: string }) ?? { ok: true };
    } catch (err: unknown) {
      extractApiError(err, "No se pudo actualizar la contraseña.");
    }
  },
};
