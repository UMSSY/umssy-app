import type { ActivationReason } from "./activation-reason.types";

export interface ActivationFailure {
  ok: false;
  status: number;
  message: string;
  reason?: ActivationReason;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
  fieldErrors: { code?: string; password?: string };
}
