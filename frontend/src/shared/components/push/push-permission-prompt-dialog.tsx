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
import { PUSH_PERMISSION_PROMPT } from "@/shared/constants/push-permission.constants";
import type { PushPermissionPromptDialogProps } from "@/shared/types/push-permission-prompt-dialog-props.types";

export function PushPermissionPromptDialog({
  open,
  onDismiss,
  onContinue,
}: PushPermissionPromptDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onDismiss();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{PUSH_PERMISSION_PROMPT.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {PUSH_PERMISSION_PROMPT.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{PUSH_PERMISSION_PROMPT.dismiss}</AlertDialogCancel>
          <AlertDialogAction type="button" onClick={onContinue}>
            {PUSH_PERMISSION_PROMPT.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
