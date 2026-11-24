"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useOptionalAuth } from "@/shared/contexts/auth-context";
import {
  getAccessToken,
  isAccessTokenReady,
  subscribeAccessToken,
  waitForAccessTokenWrites,
} from "@/shared/services/storage/access-token-storage";
import {
  hasCookieSession,
  subscribeCookieSession,
} from "@/shared/services/storage/cookie-session-state";
import { buildLoginUrl } from "../utils/safe-next-path";
import { endSession } from "../utils/session";
import { setSessionMarker } from "../utils/session-cookie";

import type { SessionGateState } from "../types/session-gate-state.types";
import type { SessionGateProps } from "../types/session-gate-props.types";

const currentPath = () => `${window.location.pathname}${window.location.search}`;

export function SessionGate({ children }: SessionGateProps) {
  const router = useRouter();
  const auth = useOptionalAuth();

  const localState = useSyncExternalStore<SessionGateState>(
    subscribeAccessToken,
    () =>
      !isAccessTokenReady()
        ? "checking"
        : getAccessToken()
          ? "open"
          : "login",
    () => "checking",
  );
  const cookieSession = useSyncExternalStore(
    subscribeCookieSession,
    hasCookieSession,
    () => false,
  );

  const isLocalOpen = localState === "open" || cookieSession;
  const state: SessionGateState = auth
    ? auth.isLoading || localState === "checking"
      ? "checking"
      : auth.isAuthenticated || isLocalOpen
        ? "open"
        : "login"
    : localState === "checking"
      ? "checking"
      : isLocalOpen
        ? "open"
        : "login";

  useEffect(() => {
    if (state === "login") {
      endSession();
      const loginUrl = buildLoginUrl(currentPath());
      if (navigator.onLine === false) {
        void waitForAccessTokenWrites().then(() => window.location.replace(loginUrl));
      }
      else router.replace(loginUrl);
      return;
    }
    if (state === "open") setSessionMarker();
  }, [state, router]);

  return state === "open" ? <>{children}</> : null;
}
