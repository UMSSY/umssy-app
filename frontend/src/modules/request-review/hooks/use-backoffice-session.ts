"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/shared/contexts/auth-context";
import { buildLoginUrl, endSession, useLogout } from "@/modules/auth";
import {
  hasRequestedManualLogout,
  isManualLogoutInProgress,
} from "@/shared/utils/manual-logout";

import { hasCookieSession, subscribeCookieSession } from "@/shared/services/storage/cookie-session-state";
import { getSessionToken } from "../utils/session";
import type { BackofficeSessionState } from "../types/backoffice-session.types";

function readSession(hasAdministrativeRole: boolean, isAuthenticated: boolean): BackofficeSessionState {
  const token = getSessionToken();
  if (!token && !isAuthenticated && !hasCookieSession()) return "login";
  return hasAdministrativeRole ? "allowed" : "forbidden";
}

export function useBackofficeSession() {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const { roles, isLoading, isAuthenticated } = useAuth();
  const state = useSyncExternalStore<BackofficeSessionState>(
    subscribeCookieSession,
    () => (isLoading ? "checking" : readSession(roles.includes("administrativo"), Boolean(isAuthenticated))),
    () => "checking",
  );

  useEffect(() => {
    if (isManualLogoutInProgress()) return;
    if (state === "login") {
      endSession();
      router.replace(hasRequestedManualLogout() ? "/login" : buildLoginUrl(pathname));
    }
    if (state === "forbidden") router.replace("/");
  }, [state, router, pathname]);

  return { state, logout };
}
