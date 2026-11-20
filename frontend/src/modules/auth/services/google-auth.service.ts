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
  reason?: "email_mismatch" | "role_not_allowed" | "server_error";
}

export interface GoogleLoginResult {
  success: boolean;
  session?: LoginResponse;
  message?: string;
  reason?: "not_registered" | "role_not_allowed" | "server_error";
}

export const GOOGLE_AUTH_STORAGE_KEY = "umssy_google_auth_payload";

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
        return reject(
          new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado.")
        );
      }

      const requestId = `gauth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const expectedStorageKey = `${GOOGLE_AUTH_STORAGE_KEY}_${requestId}`;

      // Clean up any stale auth keys from previous attempts
      try {
        localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && (k === GOOGLE_AUTH_STORAGE_KEY || k.startsWith(`${GOOGLE_AUTH_STORAGE_KEY}_`))) {
            localStorage.removeItem(k);
          }
        }
      } catch {}

      let checkInterval: ReturnType<typeof setInterval> | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let isSettled = false;

      const cleanup = () => {
        window.removeEventListener("message", handleMessage);
        window.removeEventListener("storage", handleStorage);
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        try {
          localStorage.removeItem(expectedStorageKey);
          localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
        } catch {}
      };

      const handlePayload = (idToken?: string, error?: string) => {
        if (isSettled) return;
        isSettled = true;
        cleanup();

        if (error) {
          return reject(new Error(error));
        }

        if (!idToken) {
          return reject(new Error("No se recibió credencial de Google."));
        }

        try {
          const payload = decodeGoogleIdToken(idToken);
          if (payload?.email) {
            resolve({
              email: payload.email,
              name: payload.name,
              picture: payload.picture,
              idToken,
              credential: idToken,
            });
          } else {
            reject(new Error("El ID Token no contiene correo electrónico."));
          }
        } catch (err) {
          reject(err);
        }
      };

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === "GOOGLE_AUTH_RESPONSE") {
          if (event.data.requestId && event.data.requestId !== requestId) {
            return;
          }
          handlePayload(event.data.idToken, event.data.error);
        }
      };

      const handleStorage = (event: StorageEvent) => {
        if ((event.key === expectedStorageKey || event.key === GOOGLE_AUTH_STORAGE_KEY) && event.newValue) {
          try {
            const data = JSON.parse(event.newValue);
            if (data.requestId && data.requestId !== requestId) return;
            handlePayload(data.idToken, data.error);
          } catch {
            // Ignore parse errors
          }
        }
      };

      window.addEventListener("message", handleMessage);
      window.addEventListener("storage", handleStorage);

      // Standard Google OpenID Connect authorization URL for ID Token
      const redirectUri = `${window.location.origin}/login`;
      const nonce = Math.random().toString(36).substring(2);
      const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=id_token&scope=openid%20email%20profile&nonce=${encodeURIComponent(
        nonce
      )}&state=${encodeURIComponent(
        requestId
      )}&prompt=select_account`;

      const popup = window.open(
        googleOAuthUrl,
        "google-oauth-popup",
        "width=520,height=630,left=300,top=100,menubar=no,status=no,toolbar=no"
      );

      if (!popup) {
        cleanup();
        window.location.href = googleOAuthUrl;
        return;
      }

      // Check if popup was closed or if token appeared in localStorage for this request
      checkInterval = setInterval(() => {
        try {
          const raw = localStorage.getItem(expectedStorageKey);
          if (raw) {
            const data = JSON.parse(raw);
            handlePayload(data.idToken, data.error);
            return;
          }
        } catch {}

        if (popup.closed) {
          setTimeout(() => {
            if (isSettled) return;
            try {
              const raw = localStorage.getItem(expectedStorageKey);
              if (raw) {
                const data = JSON.parse(raw);
                handlePayload(data.idToken, data.error);
                return;
              }
            } catch {}
            if (isSettled) return;
            isSettled = true;
            cleanup();
            reject(new Error("User closed prompt"));
          }, 300);
        }
      }, 500);

      timeoutId = setTimeout(() => {
        if (isSettled) return;
        isSettled = true;
        cleanup();
        reject(new Error("Tiempo de espera agotado al conectar con Google."));
      }, 120000);
    });
  },

  /**
   * Handles the OAuth redirect hash in popup or main window.
   * If in a popup, sends token to opener / localStorage and closes popup.
   * If in main window (e.g. mobile redirect), passes token to callback.
   */
  handleOAuthCallback: (onToken?: (idToken: string) => void): boolean => {
    if (typeof window === "undefined") return false;
    const hash = window.location.hash;
    if (!hash || (!hash.includes("id_token=") && !hash.includes("error="))) {
      return false;
    }

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const idToken = params.get("id_token") || undefined;
    const error = params.get("error") || undefined;
    const state = params.get("state") || undefined;

    if (!idToken && !error) return false;

    // 1. Post message to opener if present
    try {
      if (window.opener && typeof window.opener.postMessage === "function") {
        window.opener.postMessage(
          {
            type: "GOOGLE_AUTH_RESPONSE",
            requestId: state,
            idToken,
            error,
          },
          window.location.origin
        );
      }
    } catch {
      // Opener might be blocked across origins
    }

    // 2. Write to localStorage with requestId specific key
    const storageKey = state ? `${GOOGLE_AUTH_STORAGE_KEY}_${state}` : GOOGLE_AUTH_STORAGE_KEY;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ requestId: state, idToken, error, timestamp: Date.now() })
      );
    } catch {}

    const isPopup =
      Boolean(window.opener) ||
      window.name === "google-oauth-popup" ||
      window.innerWidth < 650;

    if (isPopup) {
      try {
        window.history.replaceState(null, "", window.location.pathname);
      } catch {}
      try {
        window.close();
      } catch {}
      return true;
    }

    // 3. Full-page redirect mode (e.g. mobile)
    if (idToken && onToken) {
      try {
        window.history.replaceState(null, "", window.location.pathname);
      } catch {}
      onToken(idToken);
    }

    return true;
  },

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
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { detail?: string; message?: string; code?: string };
        };
      };
      const status = axiosErr?.response?.status;
      const errorDetail =
        axiosErr?.response?.data?.detail ||
        axiosErr?.response?.data?.message;

      if (status === 403 || axiosErr?.response?.data?.code === "ROLE_NOT_ASSIGNED") {
        return {
          success: false,
          reason: "role_not_allowed",
          message:
            errorDetail ||
            "La vinculación con Google solo está permitida para estudiantes, titulados y mentores.",
        };
      }

      return {
        success: false,
        reason: "server_error",
        message:
          errorDetail ||
          "No se pudo conectar con el servidor para vincular la cuenta. Inténtalo de nuevo.",
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
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { detail?: string; message?: string; code?: string };
        };
      };
      const status = axiosErr?.response?.status;
      const errorDetail =
        axiosErr?.response?.data?.detail ||
        axiosErr?.response?.data?.message;

      if (status === 403 || axiosErr?.response?.data?.code === "ROLE_NOT_ASSIGNED") {
        return {
          success: false,
          reason: "role_not_allowed",
          message:
            errorDetail ||
            "El acceso con Google solo está permitido para estudiantes, titulados y mentores.",
        };
      }

      if (status === 404 || status === 401 || status === 400) {
        return {
          success: false,
          reason: "not_registered",
          message:
            errorDetail ||
            "Esta cuenta de Google no está registrada en el sistema.",
        };
      }

      return {
        success: false,
        reason: "server_error",
        message:
          errorDetail ||
          "Ocurrió un error al intentar iniciar sesión con Google.",
      };
    }
  },
};
