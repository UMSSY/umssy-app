"use client";
import { useRouter } from "next/navigation";
import { useUnsavedChangesGuard } from "@/shared/hooks/use-unsaved-changes-guard";
import { openOfflineRoute } from "@/shared/services/offline-navigation";

export function useLeaveGuard(isActive: boolean) {
  const router = useRouter();
  const { pendingHref, pendingAction, clearPendingHref, clearPendingAction } = useUnsavedChangesGuard(isActive);
  const clearPending = () => {
    clearPendingHref();
    clearPendingAction();
  };
  return {
    isLeaveDialogOpen: pendingHref !== null || pendingAction !== null,
    confirmLeave: () => {
      if (pendingAction) pendingAction();
      else if (pendingHref) {
        if (navigator.onLine === false) void openOfflineRoute(pendingHref);
        else router.push(pendingHref);
      }
      clearPending();
    },
    cancelLeave: clearPending,
  };
}
