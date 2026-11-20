"use client";
import { useRouter } from "next/navigation";
import { useUnsavedChangesGuard } from "@/shared/hooks/use-unsaved-changes-guard";
import { openOfflineRoute } from "@/shared/services/offline-navigation";

export function useLeaveGuard(isActive: boolean) {
  const router = useRouter();
  const { pendingHref, clearPendingHref } = useUnsavedChangesGuard(isActive);
  return {
    isLeaveDialogOpen: pendingHref !== null,
    confirmLeave: () => {
      if (pendingHref) {
        if (navigator.onLine === false) void openOfflineRoute(pendingHref);
        else router.push(pendingHref);
      }
      clearPendingHref();
    },
    cancelLeave: clearPendingHref,
  };
}
