"use client";

import { CircleCheck, Hourglass, Info, ListOrdered, LockKeyhole, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function SlotUnavailableDialog({ open, onOpenChange, isSubmitting, isRegistered = false, error, onSubmit }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  isRegistered?: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  return <Dialog open={open} onOpenChange={(value) => { if (!isSubmitting) onOpenChange(value); }}>
    <DialogContent showCloseButton={!isSubmitting && !isRegistered} aria-busy={isSubmitting} className="max-h-[calc(100dvh-2rem)] grid-cols-1 gap-0 overflow-y-auto p-0 sm:max-w-xl">
      {isRegistered ? <>
        <div className="space-y-3 p-5 sm:p-6">
          <div className="flex items-start gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
            <CircleCheck aria-hidden="true" className="mt-0.5 shrink-0" size={28} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <DialogTitle className="text-base leading-normal font-bold">Solicitud registrada correctamente</DialogTitle>
                <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold">Estado: Pendiente</span>
              </div>
              <DialogDescription className="mt-1 text-sm leading-relaxed text-text-secondary">
                Tu postulación ha sido guardada en el sistema. Puedes consultar el estado de tu solicitud y las ofertas disponibles en Mi participación.
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Info aria-hidden="true" className="mt-0.5 shrink-0 text-amber-600" size={28} />
            <div>
              <h3 className="font-bold text-ink">Ya tienes una solicitud pendiente</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">No necesitas solicitar nuevamente. El envío redundante de postulaciones no acelera el proceso de asignación de vacantes.</p>
            </div>
          </div>
        </div>
        <footer className="flex justify-end rounded-b-xl bg-surface-soft px-5 py-4 sm:px-6">
          <Button onClick={() => onOpenChange(false)} className="min-h-10 px-8">Cerrar</Button>
        </footer>
      </> : <>
      <header className="flex items-center gap-4 border-b border-border px-5 py-5 pr-12 sm:px-7 sm:pr-12">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-notice/50 text-gold">
          <Hourglass aria-hidden="true" size={28} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-text-secondary">Disponibilidad del programa</p>
          <DialogTitle className="mt-1 text-xl leading-tight font-bold text-ink sm:text-2xl">No hay cupos disponibles</DialogTitle>
        </div>
      </header>

      <div className="space-y-5 px-5 py-5 sm:px-7">
        <DialogDescription className="text-base leading-relaxed text-text-secondary">
          Actualmente todos los cupos para mentores están ocupados. Puedes solicitar un cupo y consultar el estado de tu solicitud en Mi participación.
        </DialogDescription>
        <div className="flex items-start gap-4 rounded-lg border border-availability/70 bg-interaction p-4">
          <ListOrdered aria-hidden="true" className="mt-1 shrink-0 text-availability-foreground" size={24} />
          <div>
            <h3 className="font-bold text-ink">Criterio estricto de asignación institucional (FIFO)</h3>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">Los cupos se asignan por riguroso orden cronológico de solicitud en cuanto un mentor en funciones pause o complete su ciclo.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-sm leading-relaxed text-text-secondary">
          <LockKeyhole aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
          <p>Por confidencialidad institucional, la lista de espera no exhibe números o posiciones relativas.</p>
        </div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>

      <footer className="flex flex-col-reverse gap-3 rounded-b-xl bg-surface-soft px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
        <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)} className="min-h-10 sm:px-6">Cancelar</Button>
        <Button disabled={isSubmitting} onClick={onSubmit} className="min-h-10 gap-2 sm:px-6">
          <Send aria-hidden="true" size={18} />
          {isSubmitting ? "Enviando solicitud..." : "Solicitar cupo"}
        </Button>
      </footer>
      </>}
    </DialogContent>
  </Dialog>;
}
