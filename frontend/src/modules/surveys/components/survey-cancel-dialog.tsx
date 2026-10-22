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
import type { SurveyCancelDialogProps } from "../types/survey-cancel-dialog-props.types";

export function SurveyCancelDialog({ open, onOpenChange, onConfirm }: SurveyCancelDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
          <AlertDialogDescription>
            Tu avance queda guardado en este navegador y podrás retomarlo desde el historial de encuestas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Seguir editando</AlertDialogCancel>
          <AlertDialogAction type="button" onClick={onConfirm} className="bg-ink text-surface hover:bg-ink-soft">
            Salir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
