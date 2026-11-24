"use client";

import { useRouter } from "next/navigation";
import { useOptionalAuth } from "@/shared/contexts/auth-context";
import { authService } from "../services/auth.service";
import { endSession } from "../utils/session";
import { buildLoginUrl } from "../utils/safe-next-path";
import { useSessionInactivity } from "../hooks/use-session-inactivity";
import {
  broadcastAuthEvent,
  type AuthCloseReason,
  useAuthBroadcastSync,
} from "../utils/auth-broadcast";
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
  const auth = useOptionalAuth();

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

  const closeAndRedirect = (
    broadcastReason: AuthCloseReason,
    redirectReason: AuthCloseReason,
  ) => {
    broadcastAuthEvent({ type: "SESSION_CLOSED", reason: broadcastReason });
    endSession();
    void authService.logout();
    if (typeof window !== "undefined") {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      try {
        sessionStorage.setItem("umssy_post_login_redirect", currentPath);
      } catch {
        // Ignore private browsing quota errors
      }
      const loginUrl = buildLoginUrl(currentPath);
      const separator = loginUrl.includes("?") ? "&" : "?";
      navigateTo(`${loginUrl}${separator}reason=${redirectReason}`);
    } else {
      navigateTo(`/login?reason=${redirectReason}`);
    }
  };

  const { isWarningOpen, secondsLeft, isRefreshing, stayConnected } =
    useSessionInactivity({
      idleTimeoutSeconds: idleTimeoutSeconds ?? auth?.idleTimeoutSeconds,
      warningSeconds: warningSeconds ?? auth?.warningSeconds,
      absoluteExpiresAt: absoluteExpiresAt ?? auth?.absoluteExpiresAt,
      enabled: true,
      onTimeout: () => closeAndRedirect("SESSION_EXPIRED", "SESSION_EXPIRED"),
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
      onCloseSession={() => closeAndRedirect("SESSION_REVOKED", "SESSION_EXPIRED")}
    />
  );
}
