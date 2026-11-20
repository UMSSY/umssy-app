"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { waitForAccessTokenWrites } from "@/shared/services/storage/access-token-storage";
import { endSession } from "../utils/session";
import { usePushNotifications } from "@/shared/hooks/use-push-notifications";

const PUSH_DEACTIVATION_TIMEOUT_MS = 2000;

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { deactivate } = usePushNotifications();

  return async function handleLogout() {
    const deactivation = deactivate().catch((error) => {
      console.warn("[useLogout] Push deactivation failed, continuing logout", error);
    });

    await Promise.race([
      deactivation,
      new Promise<void>((resolve) =>
        setTimeout(resolve, PUSH_DEACTIVATION_TIMEOUT_MS),
      ),
    ]);

    endSession();
    queryClient.clear();
    if (navigator.onLine === false) {
      void waitForAccessTokenWrites().then(() => window.location.replace("/login"));
    } else router.replace("/login");
  };
}