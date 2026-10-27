"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { participationErrorMessage } from "../../utils/participation-error";
import { formatParticipationDate } from "../../utils/format-participation-date";
import { PARTICIPATION_STATUS_LABELS } from "../../constants/participation-status.constants";
import type { PendingRequestDialogProps } from "../../types/pending-request-dialog-props.types";

export function PendingRequestHistoryDialog({ state }: PendingRequestDialogProps) {
  const { historyOpen, setHistoryOpen, historyQuery } = state;
  return (
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogTitle>Historial de solicitudes</DialogTitle>

          <DialogDescription>
            Consulta tus solicitudes registradas.
          </DialogDescription>

          {historyQuery.isLoading && (
            <p className="text-sm">Cargando historial...</p>
          )}

          {historyQuery.isError && (
            <div className="space-y-3">
              <p role="alert" className="text-sm text-destructive">
                {participationErrorMessage(historyQuery.error)}
              </p>

              <Button
                variant="outline"
                onClick={() => void historyQuery.refetch()}
              >
                Reintentar
              </Button>
            </div>
          )}

          {historyQuery.isSuccess &&
            historyQuery.data.length === 0 && (
              <p className="text-sm text-text-secondary">
                No tienes solicitudes registradas.
              </p>
            )}

          {historyQuery.isSuccess && (
            <div className="space-y-3">
              {historyQuery.data.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-border bg-surface-soft p-4"
                >
                  <p className="font-semibold text-ink">
                    Estado: {PARTICIPATION_STATUS_LABELS[entry.status] ?? "Estado no disponible"}
                  </p>

                  <p className="mt-2 text-sm text-text-secondary">
                    Registrada: {formatParticipationDate(entry.queuedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setHistoryOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
}
