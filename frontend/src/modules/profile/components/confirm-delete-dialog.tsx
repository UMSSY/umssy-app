import { AlertDialog } from "@base-ui/react/alert-dialog";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONFIRM_DELETE_DIALOG_LABELS } from "../config/confirm-delete-dialog.config";
import {
  DIALOG_BACKDROP_CLASS,
  DIALOG_MESSAGE_CLASS,
  DIALOG_POPUP_CLASS,
  DIALOG_TITLE_CLASS,
} from "../config/dialog-styles.config";
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "../config/form-styles.config";
import type { ConfirmDeleteDialogProps } from "../types/confirm-delete-dialog-props.types";

export function ConfirmDeleteDialog({
  isOpen,
  title,
  message,
  isDeleting = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog.Root open={isOpen} onOpenChange={isDeleting ? undefined : onCancel}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={DIALOG_BACKDROP_CLASS} />
        <AlertDialog.Popup className={DIALOG_POPUP_CLASS}>
          <AlertDialog.Title className={DIALOG_TITLE_CLASS}>{title}</AlertDialog.Title>
          <AlertDialog.Description className={DIALOG_MESSAGE_CLASS}>{message}</AlertDialog.Description>
          <div className="mt-8 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className={SECONDARY_BUTTON_CLASS}
              disabled={isDeleting}
              onClick={onCancel}
            >
              {CONFIRM_DELETE_DIALOG_LABELS.cancel}
            </Button>
            <Button
              type="button"
              className={PRIMARY_BUTTON_CLASS}
              disabled={isDeleting}
              onClick={onConfirm}
            >
              {isDeleting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
              {isDeleting
                ? CONFIRM_DELETE_DIALOG_LABELS.confirming
                : CONFIRM_DELETE_DIALOG_LABELS.confirm}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
