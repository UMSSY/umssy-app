"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocumentViewer } from "@/modules/request-review";
import type { EvidenceViewerDialogProps } from "../../types/audit-log-component-props.types";

// Reutiliza el visor del módulo de revisión mediante su API pública
export function EvidenceViewerDialog({ event, url, finalFocus, onClose }: EvidenceViewerDialogProps) {
  const isOpen = Boolean(event && url && event.evidence);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent finalFocus={finalFocus} className="w-[calc(100vw-2rem)] max-w-4xl gap-3 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Documento del evento {event?.code}</DialogTitle>
          <DialogDescription>
            Solicitud {event?.request.code}. Es el documento que se usó en ese momento, en modo de solo lectura.
          </DialogDescription>
        </DialogHeader>
        {event?.evidence && url ? (
          <DocumentViewer url={url} mimeType={event.evidence.mimeType} fileName={`${event.evidence.name}.${event.evidence.extension}`} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
