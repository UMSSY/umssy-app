import { ROLE_TAGS } from "@/shared/constants/roles.constants";
import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { SessionResponse } from "../types/session-response.types";
import type { LoginPayload, LoginResponse } from "../types/auth-types";
import type {
  RequestResetCodePayload,
  VerifyResetCodePayload,
  ResetPasswordPayload,
} from "../types/forgot-password.types";

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
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  if (detail) {
    throw new Error(detail);
  }
  if (err instanceof Error) {
    throw err;
  }
  throw new Error(fallback);
}

export const authService = {
  getSession: async (accessToken?: string | null): Promise<SessionResponse> => {
    const response = await apiClient.get<ApiResponse<SessionResponse>>("/auth/session", {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    return response.data.data;
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
