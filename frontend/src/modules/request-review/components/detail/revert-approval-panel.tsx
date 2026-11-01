"use client";

import { useState } from "react";
import { Undo2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { REVERT_SUCCESS_MESSAGE } from "../../constants/automatic-validation.constants";
import { useRevertApproval } from "../../hooks/use-revert-approval";
import type { RevertApprovalPanelProps } from "../../types/automatic-validation-props.types";

export function RevertApprovalPanel({ detail }: RevertApprovalPanelProps) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending, isSuccess, error, reset } = useRevertApproval(detail.id);

  if (isSuccess) {
    return (
      <p role="status" className="rounded-lg border border-border bg-surface p-4 text-sm text-ink">
        {REVERT_SUCCESS_MESSAGE}
      </p>
    );
  }

  if (detail.status !== "approved" || detail.validation?.result !== "auto_approved") {
    return null;
  }

  function handleRevert() {
    reset();
    mutate(undefined, { onSettled: () => setOpen(false) });
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5" aria-label="Aprobación automática">
      <h2 className="font-tight text-lg font-bold text-ink">Aprobación automática</h2>
      <p className="text-sm text-text-secondary">
        El sistema aprobó esta solicitud. Si necesitas evaluarla de nuevo, revierte la aprobación: volverá a revisión manual y se anulará el código de
        activación sin usar.
      </p>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} disabled={isPending} className="w-fit border-border bg-surface text-ink">
        <Undo2 aria-hidden="true" />
        Revertir aprobación
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error.message}
        </p>
      ) : null}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revertir la aprobación automática?</AlertDialogTitle>
            <AlertDialogDescription>
              La solicitud pasará a revisión manual a tu nombre y quedará registrada en la auditoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                handleRevert();
              }}
            >
              {isPending ? "Revirtiendo..." : "Revertir aprobación"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
