"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { endSession } from "../utils/session";
import { usePushNotifications } from "@/shared/hooks/use-push-notifications";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { deactivate } = usePushNotifications();

  return function handleLogout() {
    void deactivate().catch((error) => {
      console.warn("[useLogout] Push deactivation failed, continuing logout", error);
    });

    endSession();
    queryClient.clear();
    router.replace("/login");
  };
}