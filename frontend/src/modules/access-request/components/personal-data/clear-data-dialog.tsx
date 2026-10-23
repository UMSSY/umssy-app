"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useAccessRequestForm } from "../../contexts/access-request-context";

export function ClearDataDialog() {
  const { status, draftId, clear } = useAccessRequestForm();
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Evita dos llamadas a clear() con un doble clic antes de que el estado se refleje
  const confirmingRef = useRef(false);
  const isClearing = status === "clearing";

  function handleOpenChange(nextOpen: boolean) {
    // Mientras se limpia no se puede cerrar con Escape ni con un clic fuera
    if (!nextOpen && isClearing) return;
    setOpen(nextOpen);
    if (!nextOpen) setErrorMessage(null);
  }

  async function handleConfirm() {
    if (confirmingRef.current) return;
    confirmingRef.current = true;
    setErrorMessage(null);

    const result = await clear();
    confirmingRef.current = false;

    if (result.ok) {
      setOpen(false);
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        disabled={status !== "idle"}
        onClick={() => setOpen(true)}
        className="h-10 rounded-md px-5 text-sm font-semibold text-ink 2xl:h-12"
      >
        Limpiar datos
      </Button>

      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Limpiar los datos del formulario?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Se vaciarán todos los campos${draftId ? " y se eliminará el borrador guardado" : ""}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorMessage ? (
            <p role="alert" className="text-[13.5px] text-destructive">
              {errorMessage}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isClearing} className="h-10 rounded-md px-5 text-sm 2xl:h-12">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              disabled={isClearing}
              onClick={handleConfirm}
              className="h-10 rounded-md bg-critical-action px-5 text-sm font-semibold text-critical-action-foreground hover:bg-critical-action/90 2xl:h-12"
            >
              {isClearing ? "Limpiando..." : "Limpiar datos"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
