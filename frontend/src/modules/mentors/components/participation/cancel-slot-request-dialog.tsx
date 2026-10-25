"use client";

import { useState } from "react";
import { AlertTriangle, Info, LoaderCircle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { SlotCancellationScenario } from "../../services/slot-request-preview.service";

type CancelSlotRequestDialogProps = {
  open: boolean;
  isCancelling: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (scenario: SlotCancellationScenario) => void;
};

export function CancelSlotRequestDialog({ open, isCancelling, error, onOpenChange, onConfirm }: CancelSlotRequestDialogProps) {
  const [scenario, setScenario] = useState<SlotCancellationScenario>("success");
  function changeOpen(nextOpen: boolean) {
    if (!isCancelling) onOpenChange(nextOpen);
  }

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogContent showCloseButton={false} aria-busy={isCancelling} className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-lg">
      <header className="flex items-center gap-4 border-b border-border px-6 py-5 pr-14">
        <span className="rounded-full bg-brand-soft p-3 text-brand-red"><AlertTriangle aria-hidden="true" className="size-6" /></span>
        <div className="space-y-1"><p className="text-xs font-semibold text-brand-red">CONFIRMAR ACCIÓN</p><DialogTitle className="text-xl leading-tight font-bold text-ink">¿Cancelar solicitud de cupo?</DialogTitle></div>
      </header>
      <Button variant="ghost" size="icon-sm" disabled={isCancelling} aria-label="Cerrar modal de cancelación" onClick={() => changeOpen(false)} className="absolute top-4 right-4"><X aria-hidden="true" /></Button>
      <div className="space-y-4 px-6 py-5">
        <DialogDescription className="text-sm leading-relaxed text-text-secondary">¿Estás seguro de que deseas cancelar tu solicitud para participar como mentor?</DialogDescription>
        <div className="flex items-start gap-3 rounded-lg border border-border bg-availability p-4">
          <Info aria-hidden="true" className="size-5 shrink-0 text-accent" />
          <div><p className="text-sm font-semibold text-ink">Información importante</p><p className="mt-1 text-sm leading-relaxed text-text-secondary">Si cancelas tu solicitud, perderás tu prioridad en la lista de espera (FIFO). Si decides solicitar nuevamente un cupo, ingresarás al final de la cola.</p></div>
        </div>
        <fieldset disabled={isCancelling} className="space-y-2 rounded-lg border border-border p-3">
          <legend className="px-1 text-xs text-text-secondary">Respuesta simulada de desarrollo</legend>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={isCancelling} aria-pressed={scenario === "success"} onClick={() => setScenario("success")}>Cancelación exitosa</Button>
            <Button size="sm" variant="outline" disabled={isCancelling} aria-pressed={scenario === "error"} onClick={() => setScenario("error")}>Error al cancelar</Button>
          </div>
        </fieldset>
        <p className="text-xs text-text-secondary">Solo se modificará la solicitud simulada en memoria; no se cambiarán datos en PostgreSQL.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <footer className="flex flex-wrap justify-end gap-3 border-t border-border bg-surface-soft px-6 py-4">
        <Button variant="outline" disabled={isCancelling} onClick={() => changeOpen(false)}>Volver</Button>
        <Button variant="brand" disabled={isCancelling} onClick={() => onConfirm(scenario)}>{isCancelling ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Trash2 aria-hidden="true" />}{isCancelling ? "Cancelando solicitud..." : "Confirmar cancelación"}</Button>
      </footer>
    </DialogContent>
  </Dialog>;
}
