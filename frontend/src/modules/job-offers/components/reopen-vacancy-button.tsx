// frontend/src/modules/job-offers/components/reopen-vacancy-button.tsx
"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { JobOffer } from "../types/job-offer.types";
import { ReopenVacancyDialog } from "./reopen-vacancy-dialog";

interface ReopenVacancyButtonProps {
  jobOffer: JobOffer;
  companyId: string;
  onReopened?: (id: string) => void;
}

export function ReopenVacancyButton({
  jobOffer,
  companyId,
  onReopened,
}: ReopenVacancyButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isClosed = ["Cerrada", "Archivada", "Pausada", "CLOSED"].includes(jobOffer.status);
  if (!isClosed) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="h-8 gap-1.5 rounded-md px-2.5 text-xs font-semibold text-ink"
      >
        <RotateCcw className="size-3.5" />
        Reabrir vacante
      </Button>

      <ReopenVacancyDialog
        jobOffer={jobOffer}
        companyId={companyId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onReopened={onReopened}
      />
    </>
  );
}