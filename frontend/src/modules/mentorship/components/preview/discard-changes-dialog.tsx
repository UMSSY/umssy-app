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
      <AlertDialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md min-w-0 gap-0 overflow-y-auto rounded-lg border border-border bg-surface p-4 text-ink shadow-none ring-0 sm:max-w-md sm:p-6">
        <AlertDialogHeader className="place-items-start gap-0 text-left">
          <AlertDialogTitle className="mb-2 font-tight text-xl font-bold break-words text-ink">
            ¿Desea descartar los cambios realizados?
          </AlertDialogTitle>
          <AlertDialogDescription className="mb-6 text-left text-sm text-text-secondary">
            Tus selecciones sin guardar se eliminarán y tu perfil conservará
            las áreas técnicas y los tipos de orientación registrados.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mx-0 mb-0 flex flex-col-reverse gap-2 border-0 bg-transparent p-0 sm:flex-row sm:justify-end">
          <AlertDialogCancel
            type="button"
            onClick={onCancel}
            className="mt-0 h-auto min-h-10 w-full rounded-lg px-4 py-2 text-sm font-semibold whitespace-normal active:translate-y-0 sm:w-auto"
          >
            Seguir editando
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            onClick={onConfirm}
            className="h-auto min-h-10 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold whitespace-normal text-primary-foreground hover:bg-brand-hover active:translate-y-0 sm:w-auto"
          >
            Descartar cambios
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
