import { decodeGoogleIdToken } from "../utils/decode-google-id-token";
import { requestGoogleOAuth } from "../utils/google-oauth-redirect";
import type { GoogleOAuthRequestOptions } from "../types/google-oauth-flow.types";
export { decodeGoogleIdToken } from "../utils/decode-google-id-token";
import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { LoginResponse } from "../types/auth-types";
import { ROLE_TAGS } from "@/shared/constants/roles.constants";
import {
  GOOGLE_LINK_ALREADY_LINKED_MESSAGE,
  GOOGLE_LINK_EXPIRED_CODES,
  GOOGLE_LINK_EXPIRED_MESSAGE,
  GOOGLE_LINK_ROLE_NOT_ALLOWED_MESSAGE,
  GOOGLE_LINK_SERVER_ERROR_MESSAGE,
  GOOGLE_NOT_REGISTERED_MESSAGE,
} from "../constants/google-link.constants";
import type {
  ConfirmGoogleLinkResult,
  GoogleLinkRequest,
  GoogleLoginResult,
} from "../types/google-link.types";

function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== "object" || value === null) return false;
  const { accessToken, roleTag, roles } = value as Record<string, unknown>;
  return (
    typeof accessToken === "string" &&
    accessToken !== "" &&
    ROLE_TAGS.some((role) => role === roleTag) &&
    (roles === undefined ||
      (Array.isArray(roles) &&
        roles.length > 0 &&
        roles.every((role) => ROLE_TAGS.some((knownRole) => knownRole === role))))
  );
}

function extractLoginResponse(body: unknown): LoginResponse {
  const wrapped =
    typeof body === "object" && body !== null
      ? (body as { data?: unknown }).data
      : undefined;
  const candidate = isLoginResponse(wrapped) ? wrapped : body;
  if (!isLoginResponse(candidate)) {
    throw new Error("El backend no devolvió un token de sesión válido.");
  }
  return {
    accessToken: candidate.accessToken,
    roleTag: candidate.roleTag,
    ...(candidate.roles ? { roles: candidate.roles } : {}),
  };
}

export interface GoogleProfile {
  email: string;
  name?: string;
  picture?: string;
  idToken?: string;
  credential?: string;
}

export interface LinkGoogleResult {
  success: boolean;
  message?: string;
  reason?: "email_mismatch" | "role_not_allowed" | "server_error";
}

type ApiErrorShape = {
  response?: { status?: number; data?: { detail?: unknown; message?: unknown; code?: unknown } };
};

function readErrorStatus(err: unknown): number | undefined {
  return (err as ApiErrorShape)?.response?.status;
}

function readErrorDetail(err: unknown): string | undefined {
  const data = (err as ApiErrorShape)?.response?.data;
  if (typeof data?.detail === "string" && data.detail) return data.detail;
  if (typeof data?.message === "string" && data.message) return data.message;
  return undefined;
}

function readErrorCode(err: unknown): string | undefined {
  const code = (err as ApiErrorShape)?.response?.data?.code;
  return typeof code === "string" ? code : undefined;
}

function extractLinkRequest(body: unknown): GoogleLinkRequest | null {
  const wrapped =
    typeof body === "object" && body !== null
      ? (body as { data?: unknown }).data
      : undefined;
  const candidate = (typeof wrapped === "object" && wrapped !== null ? wrapped : body) as Record<string, unknown> | null;
  if (
    typeof candidate !== "object" ||
    candidate === null ||
    candidate.requiresLinking !== true ||
    typeof candidate.linkToken !== "string" ||
    candidate.linkToken === "" ||
    typeof candidate.email !== "string"
  ) {
    return null;
  }
  return {
    linkToken: candidate.linkToken,
    email: candidate.email,
    emailVerified: candidate.emailVerified !== false,
  };
}

export const googleAuthService = {
  promptSelectAccount: (options: GoogleOAuthRequestOptions = {}): Promise<GoogleProfile> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        return reject(new Error("No disponible en el servidor."));
      }

      const clientId =
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";

      if (!clientId) {
        return reject(
          new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado.")
        );
      }

      const google = (window as unknown as {
        google?: {
          accounts?: {
            id?: {
              initialize: (config: {
                client_id: string;
                callback: (res: { credential?: string }) => void;
                auto_select?: boolean;
                cancel_on_tap_outside?: boolean;
              }) => void;
              prompt: (momentListener?: (notification: {
                isNotDisplayed: () => boolean;
                isSkippedMoment: () => boolean;
                isDismissedMoment: () => boolean;
                getDismissedReason: () => string;
              }) => void) => void;
            };
            oauth2?: unknown;
          };
        };
      }).google;

      if (clientId && google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: (idResponse: { credential?: string }) => {
            if (!idResponse?.credential) {
              return reject(new Error("No se recibió credencial de Google."));
            }
            try {
              const payload = decodeGoogleIdToken(idResponse.credential);
              if (payload?.email) {
                resolve({
                  email: payload.email,
                  name: payload.name,
                  picture: payload.picture,
                  idToken: idResponse.credential,
                  credential: idResponse.credential,
                });
              } else {
                reject(new Error("El ID Token no contiene correo electrónico."));
              }
            } catch (err) {
              reject(err);
            }
          },
        });

        google.accounts.id.prompt((notification) => {
          if (notification?.isDismissedMoment?.() || notification?.isSkippedMoment?.()) {
            reject(new Error("User closed prompt"));
          }
        });
        return;
      }

      requestGoogleOAuth(clientId, options).then(resolve, reject);
    });
  },

  linkGoogleAccount: async (
    accountEmail: string,
    googleEmail: string,
    credentialOrIdToken?: string,
  ): Promise<LinkGoogleResult> => {
    const cleanAccount = accountEmail.trim().toLowerCase();
    const cleanGoogle = googleEmail.trim().toLowerCase();

    if (cleanAccount !== cleanGoogle) {
      return {
        success: false,
        reason: "email_mismatch",
        message: "Esta cuenta de Google no coincide con el correo registrado.",
      };
    }

    try {
      const payload: { email: string; googleEmail: string; credential?: string; idToken?: string } = {
        email: cleanAccount,
        googleEmail: cleanGoogle,
      };
      if (credentialOrIdToken) {
        payload.credential = credentialOrIdToken;
        payload.idToken = credentialOrIdToken;
      }

      const response = await apiClient.post<ApiResponse<{ ok: boolean }>>("/auth/google/link", payload);

      if (response.data && response.data.ok === false) {
        return {
          success: false,
          reason: "server_error",
          message: response.data.detail || "No se pudo vincular la cuenta de Google.",
        };
      }

      return {
        success: true,
        message: response.data?.detail ?? "Cuenta vinculada correctamente.",
      };
    } catch (err: unknown) {
      const errorDetail =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail ||
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.message ||
        "No se pudo conectar con el servidor para vincular la cuenta. Inténtalo de nuevo.";

      if ((err as { response?: { status?: number } })?.response?.status === 403) {
        return {
          success: false,
          reason: "role_not_allowed",
          message: errorDetail,
        };
      }

      return {
        success: false,
        reason: "server_error",
        message: errorDetail,
      };
    }
  },

  loginWithGoogle: async (
    googleEmail: string,
    credentialOrIdToken?: string,
  ): Promise<GoogleLoginResult> => {
    const cleanGoogle = googleEmail.trim().toLowerCase();

    try {
      const payload: { email: string; credential?: string; idToken?: string } = {
        email: cleanGoogle,
      };
      if (credentialOrIdToken) {
        payload.credential = credentialOrIdToken;
        payload.idToken = credentialOrIdToken;
      }

      const response = await apiClient.post<unknown>("/auth/google/login", payload);
      const link = extractLinkRequest(response.data);
      if (link) return { success: true, requiresLinking: true, link };
      return { success: true, session: extractLoginResponse(response.data) };
    } catch (err: unknown) {
      const status = readErrorStatus(err);
      if (status === 403) {
        return {
          success: false,
          reason: "role_not_allowed",
          message: readErrorDetail(err) ?? GOOGLE_LINK_ROLE_NOT_ALLOWED_MESSAGE,
        };
      }
      if (status === 404 || status === 401 || status === 400) {
        return {
          success: false,
          reason: "not_registered",
          message: readErrorDetail(err) ?? GOOGLE_NOT_REGISTERED_MESSAGE,
        };
      }
      return {
        success: false,
        reason: "server_error",
        message: "Ocurrió un error al intentar iniciar sesión con Google.",
      };
    }
  },

  confirmLink: async (
    linkToken: string,
    roleTag?: string,
  ): Promise<ConfirmGoogleLinkResult> => {
    try {
      const response = await apiClient.post<unknown>("/auth/google/link/confirm", {
        linkToken,
        ...(roleTag ? { roleTag } : {}),
      });
      return { success: true, session: extractLoginResponse(response.data) };
    } catch (err: unknown) {
      const status = readErrorStatus(err);
      const code = readErrorCode(err);
      if (
        status === 401 &&
        GOOGLE_LINK_EXPIRED_CODES.some((expiredCode) => expiredCode === code)
      ) {
        return { success: false, reason: "expired", message: GOOGLE_LINK_EXPIRED_MESSAGE };
      }
      if (status === 409) {
        return {
          success: false,
          reason: "already_linked",
          message: GOOGLE_LINK_ALREADY_LINKED_MESSAGE,
        };
      }
      if (status === 403) {
        return {
          success: false,
          reason: "role_not_allowed",
          message: readErrorDetail(err) ?? GOOGLE_LINK_ROLE_NOT_ALLOWED_MESSAGE,
        };
      }
      return {
        success: false,
        reason: "server_error",
        message:
          status === 429
            ? (readErrorDetail(err) ?? GOOGLE_LINK_SERVER_ERROR_MESSAGE)
            : GOOGLE_LINK_SERVER_ERROR_MESSAGE,
      };
    }
  },
};
