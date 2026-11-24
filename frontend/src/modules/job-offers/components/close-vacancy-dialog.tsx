
"use client";

import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CLOSE_JOB_OFFER_TEXT } from "../constants/job-offers.constants";
import type { JobOffer } from "../types/job-offer.types";

interface CloseVacancyDialogProps {
  offer: JobOffer | null;
  isBusy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CloseVacancyDialog({
  offer,
  isBusy,
  onConfirm,
  onCancel,
}: CloseVacancyDialogProps) {
  return (
    <Dialog
      open={offer !== null}
      onOpenChange={(open) => {
        if (!open && !isBusy) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/70"
        className="max-w-[calc(100%-2rem)] bg-white text-slate-950 sm:max-w-sm"
      >
        <DialogHeader className="items-center text-center sm:text-center">
            <DialogTitle className="text-center text-base font-semibold text-slate-950">
            {CLOSE_JOB_OFFER_TEXT.title}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-700">
            La vacante {offer?.title} dejará de recibir postulaciones.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="bg-white">
          <DialogClose
            disabled={isBusy}
            render={
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer max-md:min-h-11"
              />
            }
          >
            {CLOSE_JOB_OFFER_TEXT.cancel}
          </DialogClose>

          <Button
            type="button"
            disabled={isBusy}
            aria-busy={isBusy}
            onClick={onConfirm}
            className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700 max-md:min-h-11"
          >
            {isBusy ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
              />
            ) : null}
            {isBusy
              ? CLOSE_JOB_OFFER_TEXT.busy
              : CLOSE_JOB_OFFER_TEXT.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
