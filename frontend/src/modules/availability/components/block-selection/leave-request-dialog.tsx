"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LEAVE_REQUEST_TEXT } from "../../constants/request-appointment.constants";
import type { LeaveRequestDialogProps } from "../../types/leave-request-dialog-props.types";

export function LeaveRequestDialog({ open, onConfirm, onCancel }: LeaveRequestDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="p-6 data-[size=default]:sm:max-w-md">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="font-heading text-lg font-bold text-ink">
            {LEAVE_REQUEST_TEXT.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-text-secondary">
            {LEAVE_REQUEST_TEXT.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel className="border-border-strong bg-surface p-5 text-ink hover:bg-surface-soft">
            {LEAVE_REQUEST_TEXT.stay}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-critical-action px-4 text-critical-action-foreground hover:bg-critical-action/90"
            onClick={onConfirm}
          >
            {LEAVE_REQUEST_TEXT.leave}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
