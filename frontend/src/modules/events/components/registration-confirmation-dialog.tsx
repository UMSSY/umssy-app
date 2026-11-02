'use client';

import type { RegistrationConfirmationDialogProps } from '../types/registration-confirmation-dialog-props.types';
import { useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";


export function RegistrationConfirmationDialog({ event, open, pending, onClose, onConfirm }: RegistrationConfirmationDialogProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !pending) onClose(); }}>
      <DialogContent data-registration-dialog initialFocus={titleRef} showCloseButton={false} aria-busy={pending}>
        <DialogHeader>
          <DialogTitle ref={titleRef} tabIndex={-1}>Confirmar inscripción</DialogTitle>
          <DialogDescription>Confirma los datos del taller antes de inscribirte.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-ink">{event.title}</p>
          <p>Fecha: {event.eventDate}</p>
          <p>Horario: {event.startTime} - {event.endTime}</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancelar</Button>
          <Button type="button" disabled={pending} onClick={onConfirm}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {pending ? "Inscribiendo..." : "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
