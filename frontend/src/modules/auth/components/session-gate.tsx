"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
  const hydrateSession = auth?.hydrateSession;
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [backendProbeDone, setBackendProbeDone] = useState(false);
  const hydrateSessionRef = useRef(hydrateSession);

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
  const rawState: SessionGateState = auth
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

  const needsBackendProbe =
    rawState === "login" &&
    Boolean(hydrateSession) &&
    !hasOpenedOnce &&
    !backendProbeDone;

  const state: SessionGateState = needsBackendProbe ? "checking" : rawState;

  useEffect(() => {
    hydrateSessionRef.current = hydrateSession;
  }, [hydrateSession]);

  useEffect(() => {
    if (!needsBackendProbe) return;
    const hydrate = hydrateSessionRef.current;
    if (!hydrate) return;

    let active = true;
    queueMicrotask(async () => {
      if (!active) return;
      try {
        await hydrate();
      } catch {
        return;
      } finally {
        if (active) setBackendProbeDone(true);
      }
    });
    return () => {
      active = false;
    };
  }, [needsBackendProbe]);

  useEffect(() => {
    if (state === "login") {
      endSession();
      const loginUrl = buildLoginUrl(currentPath());
      if (navigator.onLine === false) {
        void waitForAccessTokenWrites().then(() => window.location.replace(loginUrl));
      } else {
        router.replace(loginUrl);
      }
      return;
    }
    if (state === "open") {
      setSessionMarker();
      queueMicrotask(() => setHasOpenedOnce(true));
    }
  }, [state, router]);

  return state === "open" ? <>{children}</> : null;
}
