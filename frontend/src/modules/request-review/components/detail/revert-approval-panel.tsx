"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { REQUEST_REVIEW_QUERY_KEYS } from "../../constants/request-review-query-keys.constants";
import { useInvalidateReviewQueries } from "../../hooks/use-invalidate-review-queries";
import { automaticValidationService } from "../../services/automatic-validation.service";
import type { RevertApprovalPanelProps } from "../../types/automatic-validation-props.types";

export function RevertApprovalPanel({ detail }: RevertApprovalPanelProps) {
  const queryClient = useQueryClient();
  const invalidateReviewQueries = useInvalidateReviewQueries();
  const [open, setOpen] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (message) {
    return (
      <p role="status" className="rounded-lg border border-border bg-surface p-4 text-sm text-ink">
        {message}
      </p>
    );
  }

  if (detail.status !== "approved" || detail.validation?.result !== "auto_approved") {
    return null;
  }

  async function handleRevert() {
    setIsReverting(true);
    setError(null);
    const result = await automaticValidationService.revertApproval(detail.id);
    setIsReverting(false);
    setOpen(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(REVERT_SUCCESS_MESSAGE);
    await Promise.all([
      invalidateReviewQueries(detail.id),
      queryClient.invalidateQueries({ queryKey: REQUEST_REVIEW_QUERY_KEYS.history(detail.id) }),
    ]);
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5" aria-label="Aprobación automática">
      <h2 className="font-tight text-lg font-bold text-ink">Aprobación automática</h2>
      <p className="text-sm text-text-secondary">
        El sistema aprobó esta solicitud. Si necesitas evaluarla de nuevo, revierte la aprobación: volverá a revisión manual y se anulará el código de
        activación sin usar.
      </p>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} disabled={isReverting} className="w-fit border-border bg-surface text-ink">
        <Undo2 aria-hidden="true" />
        Revertir aprobación
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
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
            <AlertDialogCancel type="button" disabled={isReverting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              disabled={isReverting}
              onClick={(event) => {
                event.preventDefault();
                void handleRevert();
              }}
            >
              {isReverting ? "Revirtiendo..." : "Revertir aprobación"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
