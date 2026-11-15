"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";
import { endSession } from "../utils/session";
import { buildLoginUrl } from "../utils/safe-next-path";
import { useSessionInactivity } from "../hooks/use-session-inactivity";
import { SessionTimeoutModal } from "./session-timeout-modal";

export function SessionInactivityGuard() {
  const router = useRouter();

  // Lee la sesión activa del servidor para obtener los tiempos dinámicos del backend
  const { data: session } = useQuery({
    queryKey: ["auth-session-timings"],
    queryFn: () => authService.getSession(),
    staleTime: 60 * 1000,
    retry: false,
  });

  const handleTimeout = () => {
    endSession();
    void authService.logout();
    if (typeof window !== "undefined") {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const loginUrl = buildLoginUrl(currentPath);
      const separator = loginUrl.includes("?") ? "&" : "?";
      router.replace(`${loginUrl}${separator}reason=SESSION_EXPIRED`);
    } else {
      router.replace("/login?reason=SESSION_EXPIRED");
    }
  };

  const handleCloseSession = () => {
    endSession();
    void authService.logout();
    router.replace("/login");
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
