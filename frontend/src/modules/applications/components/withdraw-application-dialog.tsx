"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { APPLICATION_MESSAGES } from "../constants/application.constants";
import type { WithdrawApplicationDialogProps } from "../types/applications-table-props.types";

export function WithdrawApplicationDialog({ application, onCancel, onConfirm }: WithdrawApplicationDialogProps) {
  return (
    <AlertDialog
      open={application !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{APPLICATION_MESSAGES.confirmWithdrawTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            <strong className="font-semibold text-ink">{application?.vacancyTitle}</strong>
            {" · "}
            {APPLICATION_MESSAGES.confirmWithdrawDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">{APPLICATION_MESSAGES.cancel}</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            className="bg-critical-action text-critical-action-foreground hover:bg-critical-action/90"
            onClick={() => {
              if (application) onConfirm(application.id);
            }}
          >
            {APPLICATION_MESSAGES.confirmWithdraw}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
