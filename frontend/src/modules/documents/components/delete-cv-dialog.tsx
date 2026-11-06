import { ConfirmDeleteDialog } from "@/modules/profile";
import type { DeleteCvDialogProps } from "../types/delete-cv-dialog-props.types";

export function DeleteCvDialog({
  cv,
  hasOtherCvs,
  isDeleting = false,
  onConfirm,
  onCancel,
}: DeleteCvDialogProps) {
  const fileName = (cv?.fileName ?? "").trim();
  const displayName = fileName || "El archivo";
  const nextCurrentNotice = hasOtherCvs ? " Tu CV anterior más reciente pasará a ser el vigente." : "";
  const message = cv?.isCurrent
    ? `${displayName} dejará de estar disponible en tu perfil.${nextCurrentNotice}`
    : `${displayName} se eliminará de tu historial de CVs.`;

  return (
    <ConfirmDeleteDialog
      isOpen={cv !== null}
      title="¿Eliminar este CV?"
      message={message}
      isDeleting={isDeleting}
      onConfirm={cv ? () => onConfirm(cv) : onCancel}
      onCancel={onCancel}
    />
  );
}
