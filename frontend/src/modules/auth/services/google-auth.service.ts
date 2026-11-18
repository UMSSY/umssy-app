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
   * Triggers the official native Google account selector popup (accounts.google.com).
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

      // Check if official Google Identity Services SDK is available
      const google = (window as unknown as {
        google?: {
          accounts?: {
            oauth2?: {
              initTokenClient: (config: {
                client_id: string;
                scope: string;
                prompt: string;
                callback: (res: { access_token?: string; error?: string }) => void;
              }) => { requestAccessToken: () => void };
            };
          };
        };
      }).google;

      if (clientId && google?.accounts?.oauth2) {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile",
          prompt: "select_account",
          callback: async (tokenResponse) => {
            if (tokenResponse.error || !tokenResponse.access_token) {
              return reject(new Error(tokenResponse.error || "No se seleccionó cuenta."));
            }
            try {
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const info = await res.json();
              if (info?.email) {
                resolve({
                  email: info.email,
                  name: info.name,
                  picture: info.picture,
                  idToken: tokenResponse.access_token,
                  credential: tokenResponse.access_token,
                });
              } else {
                reject(new Error("No se pudo obtener el correo de Google."));
              }
            } catch (err) {
              reject(err);
            }
          },
        });
        tokenClient.requestAccessToken();
        return;
      }

      // Standard Google OAuth 2.0 authorization URL redirect
      const redirectUri = `${window.location.origin}/login`;
      const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=openid%20email%20profile&prompt=select_account`;

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
