'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteVacancyModalProps {
  isOpen: boolean;
  vacancyTitle: string | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteVacancyModal: React.FC<DeleteVacancyModalProps> = ({
  isOpen,
  vacancyTitle,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDeleting) {
      const activeElement = document.activeElement as HTMLElement | null;
      
      const isConfirmButton = activeElement?.textContent?.includes('Eliminar');

      if (!isConfirmButton) {
        return;
      }

      e.preventDefault();
      onConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>
            ¿Eliminar vacante <span className="font-semibold text-foreground">&quot;{vacancyTitle}&quot;</span>?
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar esta vacante? Esta
            acción no se puede deshacer y la oferta dejará de ser visible para los
            candidatos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};