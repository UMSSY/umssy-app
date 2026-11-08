"use client";
import { useRouter } from "next/navigation";
import { useUnsavedChangesGuard } from "@/shared/hooks/use-unsaved-changes-guard";

export function useLeaveGuard(isActive: boolean) {
  const router = useRouter();
  const { pendingHref, clearPendingHref } = useUnsavedChangesGuard(isActive);
  return {
    isLeaveDialogOpen: pendingHref !== null,
    confirmLeave: () => {
      if (pendingHref) router.push(pendingHref);
      clearPendingHref();
    },
    cancelLeave: clearPendingHref,
  };
}
