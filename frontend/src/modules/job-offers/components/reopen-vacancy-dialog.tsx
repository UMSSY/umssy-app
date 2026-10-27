// frontend/src/modules/job-offers/components/reopen-vacancy-dialog.tsx
"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useReopenJobOffer } from "../hooks/use-reopen-job-offer";
import type { JobOffer } from "../types/job-offer.types";
import { useEffect, useRef } from "react";

interface ReopenVacancyDialogProps {
  jobOffer: JobOffer;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onReopened?: (id: string) => void;
}

export function ReopenVacancyDialog({
  jobOffer,
  companyId,
  isOpen,
  onClose,
  onReopened,
}: ReopenVacancyDialogProps) {
  const router = useRouter();

  const reopen = useReopenJobOffer({
    onSuccess: () => {
      onReopened?.(jobOffer.id); 
      onClose();                 
      router.push("/recruiters/job-offers"); 
    },
  });

  const dialogRef = useRef<HTMLDivElement>(null);

  // Manejo de tecla Escape y Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !reopen.isPending) {
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    
    const timer = setTimeout(() => {
      const firstFocusable = dialogRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, reopen.isPending, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    reopen.mutate({ companyId, jobOfferId: jobOffer.id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reopen-dialog-title"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl outline-none"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={reopen.isPending}
          className="absolute top-5 right-5 opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none"
        >
          <X className="size-5 text-ink" />
          <span className="sr-only">Cerrar</span>
        </Button>

        <div className="space-y-2 p-6 pr-10">
          <h2 id="reopen-dialog-title" className="text-xl font-bold text-ink">
            ¿Estás seguro de reabrir esta vacante?
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            Se reactivará la oferta <span className="font-semibold text-ink">({jobOffer.title})</span> para que vuelva a recibir postulaciones y cambiará su estado a activa.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/40 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={reopen.isPending}
            onClick={onClose}
            className="rounded-xl px-5"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={reopen.isPending}
            onClick={handleConfirm}
            className="gap-1.5 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
          >
            {reopen.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Reabriendo...
              </>
            ) : (
              "Reabrir"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}