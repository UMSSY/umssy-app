import type { FormEvent } from "react";

import type { ActiveCredentialRestriction } from "./credential-restriction.types";

export interface ForgotPasswordRequestStepProps {
  email: string;
  setEmail: (email: string) => void;
  emailError: string;
  setEmailError: (error: string) => void;
  onSubmit: (e: FormEvent) => void;
  isPending: boolean;
  restriction?: ActiveCredentialRestriction | null;
}

export interface ForgotPasswordVerifyStepProps {
  email: string;
  maskedEmail: string;
  otpCode: string;
  setOtpCode: (code: string) => void;
  otpError: string;
  setOtpError: (error: string) => void;
  countdown: number;
  formattedCountdown: string;
  resendCooldown: number;
  formattedCooldown: string;
  isResent: boolean;
  isPending: boolean;
  isResending: boolean;
  onSubmit: (e: FormEvent) => void;
  onResend: () => void;
  verificationRestriction?: ActiveCredentialRestriction | null;
  requestRestriction?: ActiveCredentialRestriction | null;
  resendError?: string;
}

export interface ForgotPasswordResetStepProps {
  newPassword: string;
  setNewPassword: (p: string) => void;
  confirmPassword: string;
  setConfirmPassword: (p: string) => void;
  passwordError: string;
  setPasswordError: (err: string) => void;
  isPending: boolean;
  onSubmit: (e: FormEvent) => void;
  restriction?: ActiveCredentialRestriction | null;
}
