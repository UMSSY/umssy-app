"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";
import { endSession } from "../utils/session";
import { buildLoginUrl } from "../utils/safe-next-path";
import { useSessionInactivity } from "../hooks/use-session-inactivity";
import { broadcastAuthEvent, useAuthBroadcastSync } from "../utils/auth-broadcast";
import type { SessionInactivityGuardProps } from "../types/session-inactivity-guard-props.types";
import { SessionTimeoutModal } from "./session-timeout-modal";

function useOptionalRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

export function SessionInactivityGuard({
  idleTimeoutSeconds,
  warningSeconds,
  absoluteExpiresAt,
}: SessionInactivityGuardProps = {}) {
  const router = useOptionalRouter();

  const navigateTo = (path: string) => {
    if (router) {
      router.replace(path);
    } else if (typeof window !== "undefined") {
      window.location.assign(path);
    }
  };

  // Sincroniza el cierre de sesión entre pestañas del navegador (CA10)
  useAuthBroadcastSync((message) => {
    if (
      message.type === "SESSION_CLOSED" ||
      message.type === "LOGOUT" ||
      message.type === "SESSION_EXPIRED"
    ) {
      endSession();
      const reason = message.reason || "SESSION_REVOKED";
      navigateTo(`/session-closed?reason=${reason}`);
    }
  });

  // Lee la sesión activa del servidor para obtener los tiempos dinámicos del backend
  const { data: session } = useQuery({
    queryKey: ["auth-session-timings"],
    queryFn: () => authService.getSession(),
    staleTime: 60 * 1000,
    retry: false,
  });

  const handleTimeout = () => {
    broadcastAuthEvent({ type: "SESSION_CLOSED", reason: "SESSION_EXPIRED" });
    endSession();
    void authService.logout();
    if (typeof window !== "undefined") {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      try {
        sessionStorage.setItem("umssy_post_login_redirect", currentPath);
      } catch {
        // ignore storage error
      }
      const loginUrl = buildLoginUrl(currentPath);
      const separator = loginUrl.includes("?") ? "&" : "?";
      navigateTo(`${loginUrl}${separator}reason=SESSION_EXPIRED`);
    } else {
      navigateTo("/login?reason=SESSION_EXPIRED");
    }
  };

  const handleCloseSession = () => {
    broadcastAuthEvent({ type: "SESSION_CLOSED", reason: "SESSION_REVOKED" });
    endSession();
    void authService.logout();
    if (typeof window !== "undefined") {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      try {
        sessionStorage.setItem("umssy_post_login_redirect", currentPath);
      } catch {
        // ignore storage error
      }
      const loginUrl = buildLoginUrl(currentPath);
      const separator = loginUrl.includes("?") ? "&" : "?";
      navigateTo(`${loginUrl}${separator}reason=SESSION_EXPIRED`);
    } else {
      navigateTo("/login?reason=SESSION_EXPIRED");
    }
  };

  const { isWarningOpen, secondsLeft, isRefreshing, stayConnected } =
    useSessionInactivity({
      idleTimeoutSeconds: idleTimeoutSeconds ?? session?.idleTimeoutSeconds,
      warningSeconds: warningSeconds ?? session?.warningSeconds,
      absoluteExpiresAt: absoluteExpiresAt ?? session?.absoluteExpiresAt,
      enabled: true,
      onTimeout: handleTimeout,
      onRefresh: async () => {
        await authService.refreshSession();
      },
    });

  return (
    <SessionTimeoutModal
      open={isWarningOpen}
      secondsLeft={secondsLeft}
      isRefreshing={isRefreshing}
      onStayConnected={stayConnected}
      onCloseSession={handleCloseSession}
    />
  );
}
