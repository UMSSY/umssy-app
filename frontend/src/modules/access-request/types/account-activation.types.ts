import type { LoginResponse } from "@/modules/auth";

export type ActivationState = "no_code" | "ready" | "expired" | "locked" | "activated";

export interface ActivationStatus {
  state: ActivationState;
  serverTime: string;
  expiresAt: string | null;
  resendAvailableAt: string | null;
  resendsRemaining: number;
  remainingAttempts: number;
}

export interface ActivationResend {
  serverTime: string;
  expiresAt: string;
  resendAvailableAt: string;
  resendsRemaining: number;
}

export type ActivationReason =
  | "not_found"
  | "already_activated"
  | "code_invalid"
  | "code_expired"
  | "attempts_exceeded"
  | "resend_cooldown"
  | "resend_limit"
  | "code_not_sent";

export interface ActivationFailure {
  ok: false;
  status: number;
  message: string;
  reason?: ActivationReason;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
  fieldErrors: { code?: string; password?: string };
}

export type ActivationResult<T> = { ok: true; data: T } | ActivationFailure;

export type ActivationSession = LoginResponse;

export type ActivationStep = "code" | "password";
