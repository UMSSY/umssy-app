export interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onOpenChange: (value: boolean) => void;
}
