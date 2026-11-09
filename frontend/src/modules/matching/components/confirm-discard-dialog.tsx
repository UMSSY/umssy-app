"use client";
import type { ConfirmDiscardDialogProps } from "../types/confirm-discard-dialog-props.types";

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

export function ConfirmDiscardDialog({
  open,
  candidateName,
  onConfirm,
  onCancel,
}: ConfirmDiscardDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Descartar perfil</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Confirmas que deseas descartar a {candidateName}? Esta acción solo afecta tu
            vista actual.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-critical-action text-critical-action-foreground hover:bg-critical-action/90"
            onClick={onConfirm}
          >
            Sí, descartar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
