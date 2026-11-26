"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { googleAuthService } from "../services/google-auth.service";
import type { LoginResponse } from "../types/auth-types";
import type {
  GoogleLinkError,
  GoogleLinkRequest,
  GoogleLinkStatus,
} from "../types/google-link.types";
import { resolvePostLoginPath } from "../utils/resolve-post-login-path";
import { startSession } from "../utils/session";
import { GOOGLE_LINK_SERVER_ERROR_MESSAGE } from "../constants/google-link.constants";

interface UseGoogleLinkConfirmationOptions {
  link: GoogleLinkRequest;
  nextPath?: string | null;
  onSessionStarted?: () => void;
}

export function useGoogleLinkConfirmation({
  link,
  nextPath = null,
  onSessionStarted,
}: UseGoogleLinkConfirmationOptions) {
  const router = useRouter();
  const inFlight = useRef(false);
  const [status, setStatus] = useState<GoogleLinkStatus>("pending");
  const [error, setError] = useState<GoogleLinkError | null>(null);
  const [session, setSession] = useState<LoginResponse | null>(null);

  async function confirm() {
    if (inFlight.current || status === "success") return;
    inFlight.current = true;
    setStatus("linking");
    setError(null);
    try {
      const result = await googleAuthService.confirmLink(link.linkToken);
      if (!result.success) {
        setError({ kind: result.reason, message: result.message });
        setStatus("error");
        return;
      }
      onSessionStarted?.();
      await startSession(result.session.accessToken);
      setSession(result.session);
      setStatus("success");
    } catch {
      setError({ kind: "server_error", message: GOOGLE_LINK_SERVER_ERROR_MESSAGE });
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  }

  function continueToHome() {
    if (!session) return;
    router.replace(resolvePostLoginPath(session.roles ?? session.roleTag, nextPath));
  }

  return {
    status,
    error,
    isLinking: status === "linking",
    canRetry: status === "error" && error?.kind === "server_error",
    confirm,
    continueToHome,
  };
}
