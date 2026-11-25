"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@/shared/services/api-client";
import {
  authService,
  endSession,
  getSessionRoles,
  SessionInactivityGuard,
} from "@/modules/auth";
import {
  getAccessToken,
  isAccessTokenReady,
  subscribeAccessToken,
} from "@/shared/services/storage/access-token-storage";
import {
  hasCookieSession,
  markCookieSessionActive,
  subscribeCookieSession,
} from "@/shared/services/storage/cookie-session-state";
import { setCurrentSessionUserId } from "@/shared/services/storage/session-user-id-storage";
import { readAccessTokenSubject } from "@/shared/utils/read-access-token-subject";
import { hasSessionMarker, setSessionMarker } from "@/shared/utils/session-marker";
import type { AuthContextValue } from "@/shared/types/auth-context-value.types";
import type { AuthProviderProps } from "@/shared/types/auth-provider-props.types";

const AuthContext = createContext<AuthContextValue | null>(null);
const getServerToken = () => null;
const getServerFalse = () => false;

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const accessToken = useSyncExternalStore(
    subscribeAccessToken,
    getAccessToken,
    getServerToken,
  );
  const cookieSession = useSyncExternalStore(
    subscribeCookieSession,
    hasCookieSession,
    getServerFalse,
  );
  const isStorageReady = useSyncExternalStore(
    subscribeAccessToken,
    isAccessTokenReady,
    getServerFalse,
  );
  const hasMarker = useSyncExternalStore(
    subscribeAccessToken,
    hasSessionMarker,
    getServerFalse,
  );

  const sessionEnabled = Boolean(accessToken) || cookieSession || hasMarker;
  const sessionScopeKey = accessToken
    ? (readAccessTokenSubject(accessToken) ?? accessToken)
    : sessionEnabled
      ? "cookie"
      : "anonymous";

  const session = useQuery({
    queryKey: ["auth-session", sessionScopeKey],
    queryFn: () => authService.getSession(accessToken),
    enabled: sessionEnabled,
    networkMode: "offlineFirst",
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (isApiError(session.error) && session.error.response?.status === 401) {
      endSession();
    }
  }, [session.error]);

  useEffect(() => {
    if (session.data?.id) {
      setCurrentSessionUserId(session.data.id);
      if (!accessToken && !cookieSession) {
        markCookieSessionActive();
      }
    }
  }, [session.data?.id, accessToken, cookieSession]);

  async function refreshRoles() {
    if (!sessionEnabled) return;
    await session.refetch();
  }

  async function hydrateSession(): Promise<boolean> {
    if (session.data?.id || accessToken || cookieSession) return true;
    try {
      const hydrated = await authService.getSession(null);
      if (hydrated?.id) {
        queryClient.setQueryData(["auth-session", "cookie"], hydrated);
        setCurrentSessionUserId(hydrated.id);
        markCookieSessionActive();
        setSessionMarker();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  const isAuthenticated = Boolean(
    session.data?.id || accessToken || cookieSession,
  );

  return (
    <AuthContext.Provider
      value={{
        company: sessionEnabled ? (session.data?.company ?? null) : null,
        currentUserId: sessionEnabled ? (session.data?.id ?? null) : null,
        roles: sessionEnabled
          ? (session.data?.roles ?? getSessionRoles(accessToken))
          : [],
        isLoading: !isStorageReady || (sessionEnabled && session.isPending),
        isAuthenticated,
        idleTimeoutSeconds: session.data?.idleTimeoutSeconds,
        warningSeconds: session.data?.warningSeconds,
        absoluteExpiresAt: session.data?.absoluteExpiresAt,
        refreshRoles,
        hydrateSession,
      }}
    >
      {children}
      {isAuthenticated ? (
        <SessionInactivityGuard
          idleTimeoutSeconds={session.data?.idleTimeoutSeconds}
          warningSeconds={session.data?.warningSeconds}
          absoluteExpiresAt={session.data?.absoluteExpiresAt}
        />
      ) : null}
    </AuthContext.Provider>
  );
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  const accessToken = useSyncExternalStore(
    subscribeAccessToken,
    getAccessToken,
    getServerToken,
  );
  const cookieSession = useSyncExternalStore(
    subscribeCookieSession,
    hasCookieSession,
    getServerFalse,
  );
  return (
    context ?? {
      currentUserId: null,
      roles: getSessionRoles(accessToken),
      isLoading: false,
      isAuthenticated: Boolean(accessToken) || cookieSession,
      refreshRoles: async () => {},
    }
  );
}
