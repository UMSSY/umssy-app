"use client";

import { BrandLogo } from "@/shared/components/layout/brand-logo";
import { useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
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

const HOME_PATH = "/";
const LOGIN_PATH = "/login";

export function PublicHeader() {
  const router = useRouter();
  const { status, hasData } = useAccessRequestForm();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // TODO: el borrador guardado queda huérfano en el servidor al salir (no hay GET y el id vive en memoria)
  // TODO: interceptar recarga, cierre de pestaña y botón atrás (beforeunload y popstate no son fiables en el App Router)
  function handleLinkClick(event: MouseEvent<HTMLElement>, href: string) {
    // En mitad de un envío o una limpieza no se sale ni se abre el diálogo
    if (status !== "idle") {
      event.preventDefault();
      return;
    }
    // Con datos se frena la navegación y se pide confirmación; sin datos el Link navega normal
    if (hasData) {
      event.preventDefault();
      setPendingHref(href);
    }
  }

  function handleLeave() {
    router.push(pendingHref ?? LOGIN_PATH);
    setPendingHref(null);
  }

  return (
    <header className="sticky top-0 z-40 flex h-app-header items-stretch justify-between gap-4 bg-ink pr-4 text-surface shadow-lg md:pr-6">
      <Link
        href={HOME_PATH}
        aria-label="Ir al inicio de UMSSY"
        onClick={(event) => handleLinkClick(event, HOME_PATH)}
        className="flex shrink-0 items-center bg-surface pr-12 pl-4 [clip-path:polygon(0_0,100%_0,calc(100%-2rem)_100%,0_100%)] md:pl-6"
      >
        <BrandLogo className="w-32 md:w-40" priority />
      </Link>
      <p className="flex items-center gap-1.5 text-sm text-surface/85">
        <span className="hidden sm:inline">¿Ya tienes cuenta?</span>
        {/* Button con render={<Link />} pone role="button" al ancla; por eso se usa Link con las clases de buttonVariants */}
        <Link
          href={LOGIN_PATH}
          onClick={(event) => handleLinkClick(event, LOGIN_PATH)}
          className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-sm font-semibold text-surface")}
        >
          Iniciar sesión
        </Link>
      </p>

      <AlertDialog open={pendingHref !== null} onOpenChange={(open) => (open ? null : setPendingHref(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir del formulario?</AlertDialogTitle>
            <AlertDialogDescription>Si sales, se perderán los datos ingresados</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" className="h-11 rounded-md px-5 text-sm">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={handleLeave}
              className="h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-brand-hover"
            >
              Salir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
