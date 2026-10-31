"use client";

import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  // Mientras la acción está en curso el diálogo no se puede cerrar con Esc ni con clic fuera.
  const handleOpenChange = (open: boolean) => {
    if (!open && !isBusy) onCancel?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} onKeyDown={trapTabFocus}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {cancelLabel ? (
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={onCancel}
              className="max-md:min-h-11"
            >
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={confirmVariant}
            disabled={isBusy}
            aria-busy={isBusy}
            onClick={onConfirm}
            className="max-md:min-h-11"
          >
            {isBusy ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
            {isBusy && busyLabel ? busyLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
