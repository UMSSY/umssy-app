export type ActivateParticipationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  errorMessage: string | null;
};
