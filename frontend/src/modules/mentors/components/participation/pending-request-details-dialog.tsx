"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatParticipationDate } from "../../utils/format-participation-date";
import type { PendingRequestDialogProps } from "../../types/pending-request-dialog-props.types";

export function PendingRequestDetailsDialog({ state, request }: PendingRequestDialogProps) {
  const { detailsOpen, setDetailsOpen, openedAt } = state;
  return (
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogTitle>Estado: Pendiente</DialogTitle>
          <DialogDescription>Tu solicitud está en espera de un cupo. No necesitas enviar otra solicitud.</DialogDescription>
          <span className="font-semibold">En evaluación</span>
          <p>Fecha de registro: {formatParticipationDate(request.queuedAt)}</p>
          <p>Tiempo transcurrido: {Math.floor(Math.max(0, openedAt - new Date(request.queuedAt).getTime()) / 3600000)} horas</p>
          <p className="min-w-0 text-sm">Correo institucional: <span className="block truncate font-semibold" title={request.email}>{request.email ?? "Correo institucional no disponible"}</span></p>
          <Button variant="outline" onClick={() => setDetailsOpen(false)}>Volver</Button>
        </DialogContent>
      </Dialog>
  );
}
