// frontend/src/modules/job-offers/components/reopen-vacancy-dialog.tsx
"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReopenJobOffer } from "../hooks/use-reopen-job-offer";
import type { JobOffer } from "../types/job-offer.types";
import { useEffect } from "react";

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
  const reopen = useReopenJobOffer();

  // Manejo de tecla Escape (Criterio 21)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !reopen.isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, reopen.isPending, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    reopen.mutate(
      { companyId, jobOfferId: jobOffer.id },
      {
        onSuccess: () => {
          onReopened?.(jobOffer.id);
          onClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="reopen-dialog-title"
        className="w-full max-w-md space-y-4 rounded-lg border border-border bg-surface p-6 shadow-xl"
      >
        <h2 id="reopen-dialog-title" className="text-lg font-bold text-ink">
          Reabrir vacante
        </h2>
        <p className="text-sm text-text-secondary">
          ¿Estás seguro de reabrir está vacante? (<span className="font-semibold text-ink">{jobOffer.title}</span>)
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={reopen.isPending}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={reopen.isPending}
            onClick={handleConfirm}
            className="gap-1.5"
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