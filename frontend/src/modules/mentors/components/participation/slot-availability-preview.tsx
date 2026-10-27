"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function SlotUnavailableDialog({ open, onOpenChange, isSubmitting, error, onSubmit }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  return <Dialog open={open} onOpenChange={(value) => { if (!isSubmitting) onOpenChange(value); }}>
    <DialogContent showCloseButton={!isSubmitting} aria-busy={isSubmitting} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
      <DialogTitle>No hay cupos disponibles</DialogTitle>
      <DialogDescription>Actualmente todos los cupos están ocupados. Puedes registrar una solicitud para incorporarte cuando se libere un espacio.</DialogDescription>
      <div className="rounded-lg border border-border bg-surface-soft p-4">
        <h3 className="font-semibold">Criterio de asignación institucional (FIFO)</h3>
        <p className="mt-2 text-sm">Las solicitudes se atienden por orden de llegada. La lista de espera no muestra números ni posiciones relativas.</p>
      </div>
      {error && <p role="alert">{error}</p>}
      <footer className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button disabled={isSubmitting} onClick={onSubmit}>{isSubmitting ? "Enviando solicitud..." : "Solicitar cupo"}</Button>
      </footer>
    </DialogContent>
  </Dialog>;
}
