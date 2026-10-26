"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useReopenJobOffer } from "../hooks/use-reopen-job-offer";
import type { JobOffer } from "../types/job-offer.types";

interface ReopenVacancyButtonProps {
  jobOffer: JobOffer;
  companyId: string;
  onReopened?: (id: string) => void;
}

const REOPENABLE_STATUSES = ["Cerrada", "Pausada"];

export function ReopenVacancyButton({
  jobOffer,
  companyId,
  onReopened,
}: ReopenVacancyButtonProps) {
  const [open, setOpen] = useState(false);
  const reopen = useReopenJobOffer();

  // CA 3 y CA 13: solo mostrar en estados reabribles
  if (!REOPENABLE_STATUSES.includes(jobOffer.status)) return null;

  const handleConfirm = () => {
    reopen.mutate(
      { jobOfferId: jobOffer.id, companyId },
      {
        onSuccess: () => {
          setOpen(false); // CA 18: cerrar modal tras éxito
          onReopened?.(jobOffer.id);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!reopen.isPending) setOpen(value); // CA 21: Escape cierra si no está en vuelo
      }}
    >
      <DialogTrigger render={
  <Button
    type="button"
    variant="outline"
    size="sm"
    className="h-8 gap-1.5 rounded-md px-2.5 text-xs font-semibold text-ink"
  >
    <RotateCcw className="size-3.5" />
    Reabrir vacante
  </Button>
} />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {/* CA 26: mostrar título de la vacante */}
          <DialogTitle>¿Estás seguro de reabrir esta vacante?</DialogTitle>
          <DialogDescription>
            Se reactivará <strong>{jobOffer.title}</strong> y volverá a recibir
            postulaciones.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          {/* CA 6: Cancelar cierra sin modificar */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={reopen.isPending}
          >
            Cancelar
          </Button>

          {/* CA 24: Enter funciona por autoFocus; CA 11/19: spinner y disabled */}
          <Button
            type="button"
            autoFocus
            onClick={handleConfirm}
            disabled={reopen.isPending}
          >
            {reopen.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Reabrir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}