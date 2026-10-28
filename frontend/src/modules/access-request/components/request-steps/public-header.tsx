"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
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
import { RequestAccessHeader } from "./request-access-header";

export function PublicHeader() {
  const router = useRouter();
  const { status, hasData } = useAccessRequestForm();
  const [open, setOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState("/login");

  // TODO: el borrador guardado queda huérfano en el servidor al salir (no hay GET y el id vive en memoria)
  // TODO: interceptar recarga, cierre de pestaña y botón atrás (beforeunload y popstate no son fiables en el App Router)
  function handleLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    // En mitad de un envío o una limpieza no se sale ni se abre el diálogo.
    if (status !== "idle") {
      event.preventDefault();
      return;
    }

    // Con datos se confirma la salida y se conserva el destino seleccionado.
    if (hasData) {
      event.preventDefault();
      setPendingHref(event.currentTarget.getAttribute("href") ?? "/login");
      setOpen(true);
    }
  }

  function handleLeave() {
    router.push(pendingHref);
    setOpen(false);
  }

  return (
    <>
      <RequestAccessHeader onLinkClick={handleLinkClick} />

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir del formulario?</AlertDialogTitle>

            <AlertDialogDescription>
              Si sales, se perderán los datos ingresados
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              type="button"
              className="h-10 rounded-md px-5 text-sm 2xl:h-12"
            >
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              type="button"
              onClick={handleLeave}
              className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-brand-hover 2xl:h-12"
            >
              Salir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}