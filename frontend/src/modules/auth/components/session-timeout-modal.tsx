"use client";

import { Clock, LoaderCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatCountdown } from "../utils/format-countdown";

export interface SessionTimeoutModalProps {
  open: boolean;
  secondsLeft: number;
  isRefreshing?: boolean;
  onStayConnected: () => void | Promise<void>;
  onCloseSession: () => void;
}

export function SessionTimeoutModal({
  open,
  secondsLeft,
  isRefreshing = false,
  onStayConnected,
  onCloseSession,
}: SessionTimeoutModalProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        className="max-w-md p-6 sm:p-7"
        aria-describedby="session-timeout-description"
      >
        <AlertDialogHeader className="flex flex-col items-center text-center">
          <div
            className="mb-3 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
            aria-hidden="true"
          >
            <Clock className="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <AlertDialogTitle className="text-xl font-extrabold text-ink">
            Tu sesión está por expirar
          </AlertDialogTitle>
          <AlertDialogDescription
            id="session-timeout-description"
            className="mt-1 text-sm text-text-secondary"
          >
            No hemos detectado actividad. Por seguridad, cerraremos tu sesión en:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-2 flex justify-center">
          <div
            className="w-full rounded-xl border border-border bg-slate-100 py-3 text-center font-mono text-4xl font-extrabold tracking-widest text-ink shadow-inner dark:bg-surface"
            role="timer"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatCountdown(secondsLeft)}
          </div>
        </div>

        <p className="text-center text-xs text-text-secondary">
          Si se cierra, los borradores sin guardar se eliminarán de este navegador.
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCloseSession}
            disabled={isRefreshing}
            className="h-11 rounded-lg px-5 text-sm font-semibold text-text-secondary hover:text-ink"
          >
            Cerrar sesión
          </Button>
          <Button
            type="button"
            variant="institutional"
            onClick={onStayConnected}
            disabled={isRefreshing}
            className="h-11 rounded-lg px-6 text-sm font-bold shadow-xs"
          >
            {isRefreshing ? (
              <>
                <LoaderCircle
                  className="mr-2 size-4 animate-spin"
                  aria-hidden="true"
                />
                Renovando...
              </>
            ) : (
              "Seguir conectado"
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
