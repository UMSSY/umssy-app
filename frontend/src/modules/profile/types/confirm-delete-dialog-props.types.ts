export interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  isDeleting?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}
