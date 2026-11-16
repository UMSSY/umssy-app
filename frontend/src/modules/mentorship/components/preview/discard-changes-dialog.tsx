"use client";

import type { DiscardChangesDialogProps } from "../../types/discard-changes-dialog-props.types";
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

export function DiscardChangesDialog({
  open,
  onConfirm,
  onCancel,
}: DiscardChangesDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md gap-0 rounded-lg border border-border bg-surface p-6 text-ink shadow-none ring-0 sm:max-w-md">
        <AlertDialogHeader className="place-items-start gap-0 text-left">
          <AlertDialogTitle className="mb-2 font-tight text-xl font-bold text-ink">
            ¿Desea descartar los cambios realizados?
          </AlertDialogTitle>
          <AlertDialogDescription className="mb-6 text-left text-sm text-text-secondary">
            Tus selecciones sin guardar se eliminarán y tu perfil conservará
            las áreas técnicas y los tipos de orientación registrados.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mx-0 mb-0 flex-row justify-end gap-2 border-0 bg-transparent p-0">
          <AlertDialogCancel
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg px-4 text-sm font-semibold active:translate-y-0"
          >
            Seguir editando
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-brand-hover active:translate-y-0"
          >
            Descartar cambios
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}