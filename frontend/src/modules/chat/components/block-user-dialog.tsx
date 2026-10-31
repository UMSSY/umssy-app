"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  /** Llama a la API; si falla, debe lanzar el error. */
  onConfirm: () => Promise<void>;
}

const BLOCK_ERROR_MESSAGE = "No se pudo bloquear. Intenta de nuevo.";

/** Confirmación antes de bloquear a un contacto. */
export function BlockUserDialog({
  open,
  onOpenChange,
  contactName,
  onConfirm,
}: BlockUserDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) return; // no se cierra mientras se procesa
    setHasError(false);
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    if (isPending) return;
    setIsPending(true);
    setHasError(false);
    try {
      await onConfirm();
      // Éxito: se cierra sin toast ni mensaje adicional.
      onOpenChange(false);
    } catch {
      // Error: no se presenta el bloqueo como exitoso; la ventana sigue abierta.
      setHasError(true);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent data-testid="block-user-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Quieres bloquear a {contactName}?</AlertDialogTitle>
        </AlertDialogHeader>
        {hasError && (
          <p role="alert" className="text-sm text-red-700">
            {BLOCK_ERROR_MESSAGE}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => void handleConfirm()}
          >
            {isPending ? "Bloqueando..." : "Bloquear"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}