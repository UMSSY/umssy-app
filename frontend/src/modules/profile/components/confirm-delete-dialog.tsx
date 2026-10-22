import { LoaderCircle } from "lucide-react";
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
import type { ConfirmDeleteDialogProps } from "../types/confirm-delete-dialog-props.types";

export function ConfirmDeleteDialog({
  isOpen,
  title,
  message,
  isDeleting = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={isDeleting ? undefined : onCancel}>
      <AlertDialogContent className="max-w-md gap-0 rounded-lg border border-border bg-surface p-8 text-ink shadow-sm ring-0 data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
        <AlertDialogHeader className="min-w-0 place-items-start text-left">
          <AlertDialogTitle className="min-w-0 font-tight text-2xl font-bold [overflow-wrap:anywhere] break-words text-ink">{title}</AlertDialogTitle>
          <AlertDialogDescription className="mt-2 min-w-0 text-base [overflow-wrap:anywhere] break-words text-text-secondary">{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mx-0 mt-8 mb-0 flex-row justify-end gap-3 border-t-0 bg-transparent p-0">
          <AlertDialogCancel
            className="h-10 border-border-strong px-4 text-sm text-ink hover:bg-surface-soft"
            disabled={isDeleting}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            className="h-10 bg-critical-action px-6 text-sm font-semibold text-critical-action-foreground hover:bg-critical-action/90"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
