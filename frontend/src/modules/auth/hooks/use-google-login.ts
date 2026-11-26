"use client";

import { useState } from "react";
import { googleAuthService } from "../services/google-auth.service";
import type { LoginResponse } from "../types/auth-types";
import type { GoogleLinkRequest } from "../types/google-link.types";

export interface GoogleAccessDenied {
  reason: "not_registered" | "role_not_allowed";
  message?: string;
}

export function useGoogleLogin(onSession: (session: LoginResponse) => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState<GoogleAccessDenied | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkRequest, setLinkRequest] = useState<GoogleLinkRequest | null>(null);

  async function start() {
    setIsLoading(true);
    setAccessDenied(null);
    setError(null);
    setLinkRequest(null);

    try {
      const profile = await googleAuthService.promptSelectAccount({ intent: "login" });
      if (!profile?.email) return;

      const credential = profile.idToken || profile.credential;
      const result = credential
        ? await googleAuthService.loginWithGoogle(profile.email, credential)
        : await googleAuthService.loginWithGoogle(profile.email);

      if (!result.success) {
        if (result.reason === "role_not_allowed" || result.reason === "not_registered") {
          setAccessDenied({ reason: result.reason, message: result.message });
        } else {
          setError(result.message || "Ocurrió un error al intentar iniciar sesión con Google.");
        }
        return;
      }

      if (result.requiresLinking) {
        setLinkRequest(result.link);
        return;
      }
      await onSession(result.session);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("NEXT_PUBLIC_GOOGLE_CLIENT_ID")) {
        setError(
          "El servicio de inicio de sesión con Google no está disponible en este momento. Por favor, inicia sesión con tu correo y contraseña.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    accessDenied,
    error,
    linkRequest,
    start,
    clearAccessDenied: () => setAccessDenied(null),
    clearLinkRequest: () => setLinkRequest(null),
    clearError: () => setError(null),
  };
}
