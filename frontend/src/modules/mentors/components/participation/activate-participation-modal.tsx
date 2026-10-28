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
        className="max-h-[90vh] max-w-md gap-0 overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-ink shadow-xl"
      >
        <div className="p-6 sm:p-7">
          <DialogHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div className="flex items-center gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/5 text-accent">
                <Zap aria-hidden="true" size={24} />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">
                  Estado de mentor
                </p>
                <DialogTitle className="mt-1 text-xl font-bold tracking-tight text-ink">
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
            Continuarás al proceso de incorporación. Allí podrás revisar tus preferencias
            guardadas y solicitar tu regreso según los cupos disponibles.
          </DialogDescription>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-surface-soft p-3.5">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent"
              size={17}
            />
            <p className="text-xs leading-relaxed text-text-secondary">
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

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="h-9 px-5 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="h-9 gap-2 bg-accent px-4 text-xs text-accent-foreground hover:bg-brand-hover"
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
