"use client";

import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";
import { endSession } from "../utils/session";
import { buildLoginUrl } from "../utils/safe-next-path";
import { useSessionInactivity } from "../hooks/use-session-inactivity";
import type { SessionInactivityGuardProps } from "../types/session-inactivity-guard-props.types";
import { broadcastAuthEvent, useAuthBroadcastSync } from "../utils/auth-broadcast";
import { SessionTimeoutModal } from "./session-timeout-modal";

function useOptionalRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

export function SessionInactivityGuard({ session }: SessionInactivityGuardProps = {}) {
  const router = useOptionalRouter();

  const navigateTo = (path: string) => {
    if (router) {
      router.replace(path);
    } else if (typeof window !== "undefined") {
      window.location.assign(path);
    }
  };

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
      idleTimeoutSeconds: session?.idleTimeoutSeconds,
      warningSeconds: session?.warningSeconds,
      absoluteExpiresAt: session?.absoluteExpiresAt,
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
