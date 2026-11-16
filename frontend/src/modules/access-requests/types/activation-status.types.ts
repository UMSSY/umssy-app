import type { ActivationState } from "./activation-state.types";

export interface ActivationStatus {
  state: ActivationState;
  serverTime: string;
  expiresAt: string | null;
  resendAvailableAt: string | null;
  resendsRemaining: number;
  remainingAttempts: number;
}
