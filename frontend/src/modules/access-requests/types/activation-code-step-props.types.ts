import type { ActivationStatus } from "./activation-status.types";

export interface ActivationCodeStepProps {
  email: string;
  status: ActivationStatus;
  expiresIn: number;
  resendIn: number;
  isBusy: boolean;
  isVerifying: boolean;
  isResending: boolean;
  error?: string | undefined;
  info?: string | undefined;
  onVerify: (code: string) => void;
  onResend: () => void;
}
