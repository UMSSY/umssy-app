export interface DeactivateParticipationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  errorMessage: string | null;
  hasFutureAppointments: boolean;
  areas: string[];
  orientations: string[];
}
