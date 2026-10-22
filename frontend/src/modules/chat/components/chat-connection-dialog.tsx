"use client";

import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";

interface ChatConnectionDialogProps {
  open: boolean;
  onRetry: () => void;
  onClose: () => void;
}

export function ChatConnectionDialog({ open, onRetry, onClose }: ChatConnectionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Error de conexión</AlertDialogTitle>
          <AlertDialogDescription>No pudimos cargar tus conversaciones. Comprueba tu conexión e inténtalo nuevamente.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={onRetry}>Reintentar</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
