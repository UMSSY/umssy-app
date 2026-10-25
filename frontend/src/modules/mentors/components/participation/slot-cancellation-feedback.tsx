"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useSlotRequestPreview } from "../../hooks/use-slot-request-preview";
import { ParticipationEmptyState } from "./participation-empty-state";

export function SlotCancellationFeedback() {
  const preview = useSlotRequestPreview();
  return <>
    <ParticipationEmptyState />
    <Dialog open={preview.notice === "cancelled"} onOpenChange={(open) => { if (!open) preview.dismissNotice(); }}>
      <DialogContent className="sm:max-w-lg">
        <CheckCircle aria-hidden="true" className="size-8 text-accent" />
        <DialogTitle className="text-xl font-bold text-ink">Solicitud cancelada correctamente</DialogTitle>
        <DialogDescription>La solicitud simulada dejó de estar pendiente. Si vuelves a solicitar un cupo, será una nueva solicitud y entrará al final de la cola FIFO.</DialogDescription>
        <p className="text-xs text-text-secondary">Cancelación de desarrollo: no se modificaron datos reales en PostgreSQL.</p>
        <div className="flex justify-end"><Button onClick={preview.dismissNotice}>Cerrar</Button></div>
      </DialogContent>
    </Dialog>
  </>;
}
