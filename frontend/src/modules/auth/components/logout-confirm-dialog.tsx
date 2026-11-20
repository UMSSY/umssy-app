"use client";

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
import { useLogout } from "../hooks/use-logout";
import type { LogoutConfirmDialogProps } from "../types/logout-confirm-dialog-props.types";

// El contenido solo se monta con el diálogo abierto, así quien muestra el botón de salir no necesita el cliente de consultas
function LogoutConfirmAction() {
  const handleLogout = useLogout();
  return (
    <AlertDialogAction
      type="button"
      onClick={handleLogout}
      className="h-11 rounded-md bg-critical-action px-5 text-sm font-semibold text-critical-action-foreground hover:bg-critical-action/90"
    >
      Cerrar sesión
    </AlertDialogAction>
  );
}

export function LogoutConfirmDialog({ open, onOpenChange }: LogoutConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Seguro que deseas cerrar sesión?</AlertDialogTitle>
          <AlertDialogDescription>Volverás a la pantalla de inicio de sesión y tendrás que ingresar tus credenciales de nuevo.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" className="h-11 rounded-md px-5 text-sm">
            Cancelar
          </AlertDialogCancel>
          <LogoutConfirmAction />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
