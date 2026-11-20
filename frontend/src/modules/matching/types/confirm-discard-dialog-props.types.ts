export interface ConfirmDiscardDialogProps {
  open: boolean;
  candidateName: string;
  onConfirm: () => void;
  onCancel: () => void;
}
