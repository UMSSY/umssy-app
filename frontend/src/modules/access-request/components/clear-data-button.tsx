"use client";

import { useState } from "react";
import { Eraser } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ClearDataButtonProps {
  // Se ejecuta solo cuando la persona confirma el diálogo
  onConfirm: () => void;
  disabled?: boolean;
}

export function ClearDataButton({ onConfirm, disabled = false }: ClearDataButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="border-border-strong bg-surface text-ink hover:bg-surface-soft"
      >
        <Eraser className="size-4" aria-hidden="true" />
        Limpiar datos
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Limpiar todos los datos?</AlertDialogTitle>
            <AlertDialogDescription>
              Se vaciarán todos los campos, se quitarán los mensajes de error y se descartarán los
              datos guardados temporalmente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-accent text-surface hover:bg-accent/90">
              Sí, limpiar datos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}