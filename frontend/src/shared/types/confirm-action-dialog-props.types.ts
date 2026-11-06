export interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  busy?: boolean;
  onConfirm: () => void;
  onOpenChange: (value: boolean) => void;
}
