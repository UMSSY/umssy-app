'use client';

import { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { CancelRegistrationDialogProps } from '../types/cancel-registration-dialog-props.types';

export function CancelRegistrationDialog({
  open,
  pending = false,
  disabled = false,
  onClose,
  onConfirm,
}: CancelRegistrationDialogProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
    >
      <DialogContent
        data-cancel-registration-dialog
        initialFocus={titleRef}
        showCloseButton={!pending}
        aria-busy={pending}
        className="p-6 text-center sm:max-w-md sm:p-8"
      >
        <div
          aria-hidden="true"
          className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500 text-3xl font-bold text-white"
        >
          !
        </div>

        <DialogHeader className="items-center text-center">
          <DialogTitle
            ref={titleRef}
            tabIndex={-1}
            className="text-center text-xl leading-snug font-bold text-ink"
          >
            ¿Estás seguro de que deseas cancelar tu inscripción a este taller?
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-text-secondary">
            Esta acción liberará tu cupo y ya no podrás acceder a los detalles de
            este taller.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col-reverse justify-center gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onClose}
            className="w-full sm:w-auto sm:min-w-28"
          >
            Volver
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || disabled}
            onClick={onConfirm}
            className="w-full sm:w-auto sm:min-w-28"
          >
            {pending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : null}
            {pending ? 'Cancelando...' : 'Sí, cancelar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}