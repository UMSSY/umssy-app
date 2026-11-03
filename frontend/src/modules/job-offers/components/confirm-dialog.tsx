"use client";

import { LoaderCircle } from "lucide-react";
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
import type { ConfirmDialogProps } from "../types/confirm-dialog-props.types";
import { trapTabFocus } from "../utils/trap-tab-focus";

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  busyLabel,
  isBusy = false,
  confirmVariant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Mientras la acción está en curso el diálogo no se puede cerrar con Esc ni con Cancelar.
  const handleOpenChange = (open: boolean) => {
    if (!open && !isBusy) onCancel?.();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent onKeyDown={trapTabFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {cancelLabel ? (
            <AlertDialogCancel disabled={isBusy} className="max-md:min-h-11">
              {cancelLabel}
            </AlertDialogCancel>
          ) : null}
          <AlertDialogAction
            type="button"
            variant={confirmVariant}
            disabled={isBusy}
            aria-busy={isBusy}
            onClick={onConfirm}
            className="max-md:min-h-11"
          >
            {isBusy ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
            {isBusy && busyLabel ? busyLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
