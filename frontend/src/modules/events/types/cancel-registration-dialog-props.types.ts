export interface CancelRegistrationDialogProps {
  open: boolean;
  pending?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}