"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Application } from "../types/application.types";

interface ReactivateApplicationDialogProps {
  application: Application | null;
  isPending: boolean;
  hasError: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ReactivateApplicationDialog({
  application,
  isPending,
  hasError,
  onCancel,
  onConfirm,
}: ReactivateApplicationDialogProps) {
  return (
    <AlertDialog
      open={application !== null}
      onOpenChange={(open) => {
        if (!open && !isPending) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar nueva postulación?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de volver a postular a la vacante{" "}
            <strong className="font-semibold text-ink">
              {application?.vacancyTitle}
            </strong>{" "}
            en{" "}
            <strong className="font-semibold text-ink">
              {application?.companyName}
            </strong>
            . Tu solicitud pasará nuevamente a estado En revisión con la fecha de hoy.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {hasError && (
          <p role="alert" className="text-sm text-destructive">
            No se pudo reactivar la postulación. Comprueba que la vacante siga disponible.
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            className="bg-green-600 text-white hover:bg-green-700"
            disabled={isPending || application === null}
            onClick={onConfirm}
          >
            {isPending ? "Confirmando…" : "Confirmar postulación"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
