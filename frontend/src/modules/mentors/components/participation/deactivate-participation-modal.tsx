"use client";

import Link from "next/link";
import type { DeactivateParticipationModalProps } from "../../types/deactivate-participation-modal-props.types";
import type { SavedItemsProps } from "../../types/saved-items-props.types";

import { AlertTriangle, ShieldCheck, UserRoundX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function SavedItems({ label, items }: SavedItemsProps) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:gap-3">
      <span className="shrink-0 text-xs text-text-secondary sm:w-24">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className="max-w-full rounded border border-border bg-surface px-2 py-0.5 text-xs font-semibold break-words text-ink"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-xs text-text-secondary">Sin configuración</span>
        )}
      </div>
    </div>
  );
}

export function DeactivateParticipationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  errorMessage,
  hasFutureAppointments,
  areas,
  orientations,
}: DeactivateParticipationModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-[calc(100%-2rem)] max-w-lg min-w-0 grid-cols-1 gap-0 overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-ink shadow-xl"
      >
        <div className="min-w-0 p-4 sm:p-7">
          <DialogHeader className="min-w-0 flex-row items-start justify-between gap-3 space-y-0">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-critical-action/20 bg-critical-action/5 text-critical-action sm:size-12">
                <UserRoundX aria-hidden="true" size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">
                  Estado de mentor
                </p>
                <DialogTitle className="mt-1 text-lg font-bold tracking-tight break-words text-ink sm:text-xl">
                  Desactivar participación
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
            Tu perfil dejará de aparecer como mentor disponible en el directorio
            y no recibirás nuevas solicitudes de asesoramiento mientras tu
            participación esté desactivada.
          </DialogDescription>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-surface-soft p-3.5">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent"
              size={17}
            />
            <div className="min-w-0 text-xs leading-relaxed text-text-secondary">
              Tus áreas técnicas y tipos de orientación permanecerán guardados.
              Se liberará tu cupo y podrás solicitar la reincorporación desde
              este panel.
              <p className="mt-2 flex items-start gap-1.5 border-t border-border pt-2 font-medium text-ink-soft">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-accent"
                  size={14}
                />
                La reincorporación depende de la validación y de los cupos
                disponibles.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-danger/20 bg-interaction p-3 text-xs font-medium text-danger"
            >
              {errorMessage}
              {hasFutureAppointments && (
                <p className="mt-2">
                  <Link href="/mentor/availability" className="underline">
                    Resolver mis citas en la agenda
                  </Link>
                </p>
              )}
            </div>
          )}

          <section
            className="mt-5"
            aria-label="Configuración que permanecerá guardada"
          >
            <h3 className="mb-2.5 text-[10.5px] font-bold tracking-wider text-ink-soft uppercase">
              Configuración que permanecerá guardada
            </h3>
            <div className="space-y-3 rounded-xl border border-border bg-surface-soft/50 p-3">
              <SavedItems label="Áreas:" items={areas} />
              <SavedItems label="Orientación:" items={orientations} />
            </div>
          </section>

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
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
              className="h-auto min-h-9 w-full gap-2 px-4 py-2 text-xs whitespace-normal sm:w-auto"
            >
              <UserRoundX aria-hidden="true" size={15} />
              {isLoading ? "Procesando..." : "Desactivar participación"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
