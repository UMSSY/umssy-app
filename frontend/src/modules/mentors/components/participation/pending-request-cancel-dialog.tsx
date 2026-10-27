"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { participationErrorMessage } from "../../utils/participation-error";
import type { PendingRequestDialogProps } from "../../types/pending-request-dialog-props.types";

export function PendingRequestCancelDialog({ state }: PendingRequestDialogProps) {
  const { cancelOpen, setCancelOpen, cancelMutation, runOperation } = state;
  return (
      <Dialog open={cancelOpen} onOpenChange={(value) => { if (!cancelMutation.isPending) setCancelOpen(value); }}>
        <DialogContent showCloseButton={!cancelMutation.isPending} className="sm:max-w-lg">
          <DialogTitle>¿Cancelar solicitud de cupo?</DialogTitle>

          <DialogDescription>
            Si cancelas tu solicitud, perderás tu prioridad en la lista FIFO.
            Si vuelves a solicitar un cupo, ingresarás al final de la cola.
          </DialogDescription>

          {cancelMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {participationErrorMessage(cancelMutation.error)}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              disabled={cancelMutation.isPending}
              onClick={() => setCancelOpen(false)}
            >
              Volver
            </Button>

            <Button
              variant="brand"
              disabled={cancelMutation.isPending}
              onClick={() => void runOperation(() => cancelMutation.mutateAsync())}
            >
              {cancelMutation.isPending
                ? "Cancelando..."
                : "Confirmar cancelación"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
}
