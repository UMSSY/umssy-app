"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { endSession } from "../utils/session";
import { waitForAccessTokenWrites } from "@/shared/services/storage/access-token-storage";
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return function handleLogout() {
    endSession();
    queryClient.clear();
    if (navigator.onLine === false) {
      void waitForAccessTokenWrites().then(() => window.location.replace("/login"));
    }
    else router.replace("/login");
  };
}
