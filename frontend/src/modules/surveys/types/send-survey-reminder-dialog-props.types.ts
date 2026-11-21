export interface SendSurveyReminderDialogProps {
  open: boolean;
  pendingCount: number;
  audienceLabel: string;
  isSending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
