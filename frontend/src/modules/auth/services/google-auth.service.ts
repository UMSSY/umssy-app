import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { LoginResponse } from "../types/auth-types";
import { ROLE_TAGS } from "@/shared/constants/roles.constants";

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

export function decodeGoogleIdToken(token: string): {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
} {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return {};
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

export interface LinkGoogleResult {
  success: boolean;
  message?: string;
  reason?: "email_mismatch" | "server_error";
}

export interface GoogleLoginResult {
  success: boolean;
  session?: LoginResponse;
  message?: string;
  reason?: "not_registered" | "server_error";
}

export const googleAuthService = {
  /**
   * Triggers the official native Google Identity Services ID Token flow (google.accounts.id).
   */
  promptSelectAccount: (): Promise<GoogleProfile> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        return reject(new Error("No disponible en el servidor."));
      }

      const clientId =
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";

      if (!clientId) {
        alert(
          "Para que Google muestre tus cuentas en su interfaz oficial, necesitas configurar tu Client ID en frontend/.env.local (NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_id.apps.googleusercontent.com)."
        );
        return reject(
          new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado.")
        );
      }

      // Check if official Google Identity Services (GIS) ID Token SDK is available
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

      // Standard Google OpenID Connect authorization URL for ID Token
      const redirectUri = `${window.location.origin}/login`;
      const nonce = Math.random().toString(36).substring(2);
      const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=id_token&scope=openid%20email%20profile&nonce=${encodeURIComponent(
        nonce
      )}&prompt=select_account`;

      const popup = window.open(
        googleOAuthUrl,
        "google-oauth-popup",
        "width=520,height=630,left=300,top=100,menubar=no,status=no,toolbar=no"
      );

      if (!popup) {
        window.location.href = googleOAuthUrl;
      }
    });
  },

  /**
   * Compares the selected Google email with the activated account's email
   * and links the Google account.
   */
  linkGoogleAccount: async (
    accountEmail: string,
    googleEmail: string,
    credentialOrIdToken?: string,
  ): Promise<LinkGoogleResult> => {
    const cleanAccount = accountEmail.trim().toLowerCase();
    const cleanGoogle = googleEmail.trim().toLowerCase();

    // Verification: emails must match
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

      return {
        success: false,
        reason: "server_error",
        message: errorDetail,
      };
    }
  },

  /**
   * Logs in using the selected Google account.
   */
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
      const session = extractLoginResponse(response.data);
      return {
        success: true,
        session,
      };
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404 || status === 401 || status === 400) {
        return {
          success: false,
          reason: "not_registered",
          message: "Esta cuenta de Google no está registrada en el sistema.",
        };
      }
      return {
        success: false,
        reason: "server_error",
        message: "Ocurrió un error al intentar iniciar sesión con Google.",
      };
    }
  },
};
