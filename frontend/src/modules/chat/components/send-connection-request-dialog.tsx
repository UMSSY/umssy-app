
"use client";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { User } from "../types/user.types";

interface SendConnectionRequestDialogProps {
  contact: User | null;
  isSending: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function SendConnectionRequestDialog({
  contact,
  isSending,
  error,
  onConfirm,
  onClose,
}: SendConnectionRequestDialogProps) {
  return (
    <Dialog
      open={contact !== null}
      onOpenChange={(open) => {
        if (!open && !isSending) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Solicitud de conexión
          </DialogTitle>

          <DialogDescription>
            ¿Deseas enviar una solicitud de conexión a{" "}
            <strong>{contact?.fullName}</strong>?
            Podrás iniciar una conversación cuando la acepte.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSending}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSending || !contact}
          >
            {isSending
              ? "Enviando..."
              : "Enviar solicitud"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
