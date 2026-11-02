"use client";

import { AlertTriangle, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ActivateParticipationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  errorMessage: string | null;
};

export function ActivateParticipationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  errorMessage,
}: ActivateParticipationModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-[calc(100%-2rem)] max-w-md min-w-0 grid-cols-1 gap-0 overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-ink shadow-xl"
      >
        <div className="min-w-0 p-4 sm:p-7">
          <DialogHeader className="min-w-0 flex-row items-start justify-between gap-3 space-y-0">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/5 text-accent sm:size-12">
                <Zap aria-hidden="true" size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">
                  Estado de mentor
                </p>
                <DialogTitle className="mt-1 text-lg font-bold tracking-tight break-words text-ink sm:text-xl">
                  Activar participación
                </DialogTitle>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Cerrar modal"
              className="text-text-secondary hover:text-ink"
            >
              <X aria-hidden="true" size={20} />
            </Button>
          </DialogHeader>

          <DialogDescription className="mt-4 text-[13px] leading-relaxed text-text-secondary">
            Continuarás al proceso de incorporación. Allí podrás revisar tus
            preferencias guardadas y solicitar tu regreso según los cupos
            disponibles.
          </DialogDescription>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-surface-soft p-3.5">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent"
              size={17}
            />
            <p className="min-w-0 text-xs leading-relaxed text-text-secondary">
              La activación requiere validación del servidor. Si no hay cupos,
              podrás usar la solicitud y las ofertas existentes.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-danger/20 bg-interaction p-3 text-xs font-medium text-danger"
            >
              {errorMessage}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="h-auto min-h-9 w-full px-5 py-2 text-xs whitespace-normal sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="h-auto min-h-9 w-full gap-2 px-4 py-2 text-xs whitespace-normal sm:w-auto"
            >
              <Zap aria-hidden="true" size={15} />
              {isLoading ? "Procesando..." : "Continuar a incorporación"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
