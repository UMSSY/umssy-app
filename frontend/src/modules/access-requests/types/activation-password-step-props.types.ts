export interface ActivationPasswordStepProps {
  isActivating: boolean;
  serverError?: string | undefined;
  onSubmit: (password: string) => void;
  onBack: () => void;
}
