import type { EventDetail } from './event-detail.types';

export interface RegistrationConfirmationDialogProps {
  event: EventDetail;
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
