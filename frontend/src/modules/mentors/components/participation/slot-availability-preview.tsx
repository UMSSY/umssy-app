"use client";

import { useState } from "react";
import { Hourglass, Info, ListOrdered, Lock, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/** Development preview only: no availability API exists yet. */
export function SlotAvailabilityPreview() {
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <section aria-label="Disponibilidad de cupos (simulación)" className="mb-6 rounded-lg border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-ink">Disponibilidad de cupos</h2>
          <p className="text-sm font-semibold text-accent" role="status">
            {available ? "Hay cupos disponibles" : "Todos los cupos están ocupados"}
          </p>
          <p className="text-xs text-text-secondary">Datos simulados para desarrollo y pruebas. No representan la disponibilidad real del programa.</p>
        </div>
        {!available && <Button variant="outline" onClick={() => setOpen(true)}>Consultar cupos</Button>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Controles de simulación">
        <Button size="sm" variant="secondary" aria-pressed={!available} onClick={() => setAvailable(false)}>Simular cupos ocupados</Button>
        <Button size="sm" variant="secondary" aria-pressed={available} onClick={() => setAvailable(true)}>Simular cupos disponibles</Button>
      </div>

      <SlotUnavailableDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}


export function SlotUnavailableDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [showRequestNotice, setShowRequestNotice] = useState(false);
  function changeOpen(nextOpen: boolean) {
    setShowRequestNotice(false);
    onOpenChange(nextOpen);
  }
  return (
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-xl">
          <header className="flex items-center gap-4 border-b border-border px-6 py-5 pr-14">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-notice text-notice-foreground"><Hourglass className="size-6" aria-hidden="true" /></span>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-secondary">DISPONIBILIDAD DEL PROGRAMA</p>
              <DialogTitle className="text-xl leading-tight font-bold text-ink">No hay cupos disponibles</DialogTitle>
            </div>
          </header>
          <DialogClose render={<Button variant="ghost" size="icon-sm" className="absolute top-4 right-4" aria-label="Cerrar modal" />}>
            <X aria-hidden="true" />
          </DialogClose>
          <div className="space-y-4 px-6 py-5">
            <DialogDescription className="text-sm leading-relaxed text-text-secondary">
              Actualmente todos los cupos para mentores están ocupados. Puedes solicitar un cupo y te avisaremos cuando se libere uno.
            </DialogDescription>
            <div className="flex items-start gap-4 rounded-lg border border-border bg-surface-soft p-4">
              <ListOrdered aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">Criterio de asignación institucional (FIFO)</p>
                <p className="text-sm leading-relaxed text-text-secondary">Los cupos se asignan por orden de llegada: la solicitud más antigua se atiende primero cuando un mentor libera su cupo.</p>
              </div>
            </div>
            <p className="flex items-start gap-3 text-sm text-text-secondary"><Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Por confidencialidad institucional, la lista de espera no exhibe números o posiciones relativas.</p>
            <p className="text-xs text-text-secondary">Simulación de desarrollo. El registro de solicitudes estará disponible en la siguiente entrega.</p>
            {showRequestNotice && <p role="status" className="flex items-start gap-2 rounded-lg bg-surface-soft p-3 text-sm text-ink"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />El registro de solicitudes aún no está habilitado. No se ha enviado ninguna solicitud.</p>}
          </div>
          <footer className="flex flex-wrap justify-end gap-3 border-t border-border bg-surface-soft px-6 py-4">
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button onClick={() => setShowRequestNotice(true)}><Send aria-hidden="true" />Solicitar cupo</Button>
          </footer>
        </DialogContent>
      </Dialog>
  );
}
