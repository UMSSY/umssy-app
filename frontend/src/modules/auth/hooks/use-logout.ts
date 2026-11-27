"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { usePushNotifications } from "@/shared/hooks/use-push-notifications";
import { waitForAccessTokenWrites } from "@/shared/services/storage/access-token-storage";
import { runManualLogout } from "@/shared/utils/manual-logout";
import { authService } from "../services/auth.service";
import { broadcastAuthEvent } from "../utils/auth-broadcast";
import { endSession } from "../utils/session";

const PUSH_DEACTIVATION_TIMEOUT_MS = 2_000;

async function deactivatePush(deactivate: () => Promise<void>): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      deactivate(),
      new Promise<void>((resolve) => {
        timeoutId = setTimeout(resolve, PUSH_DEACTIVATION_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    console.warn("No se pudieron desactivar las notificaciones push.", error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { deactivate } = usePushNotifications();

  return function handleLogout() {
    return runManualLogout(async () => {
      if (navigator.onLine !== false) {
        await deactivatePush(deactivate);
        try {
          await authService.logout();
          broadcastAuthEvent({ type: "SESSION_CLOSED", reason: "SESSION_REVOKED" });
        } catch (error) {
          console.warn("No se pudo confirmar el cierre de sesión en el servidor.", error);
        }
      }

      endSession();
      queryClient.clear();

      if (navigator.onLine === false) {
        await waitForAccessTokenWrites();
        window.location.replace("/login");
      } else {
        router.replace("/login");
      }
    });
  };
}
