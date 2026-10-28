import type { LoginResponse } from "@/modules/auth/types/auth-types";

export type ActivationState = "no_code" | "ready" | "expired" | "locked" | "activated";

// Respuesta de GET /account-activation/status; los instantes llegan en ISO 8601
export interface ActivationStatus {
  state: ActivationState;
  serverTime: string;
  expiresAt: string | null;
  resendAvailableAt: string | null;
  resendsRemaining: number;
  remainingAttempts: number;
}

// Respuesta de POST /account-activation/resend
export interface ActivationResend {
  serverTime: string;
  expiresAt: string;
  resendAvailableAt: string;
  resendsRemaining: number;
}

// Razones que el backend informa en data.reason
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

// Pasos internos de la pantalla: primero el código, luego la contraseña
export type ActivationStep = "code" | "password";

export interface PasswordRule {
  id: "length" | "uppercase" | "digit";
  label: string;
  met: boolean;
}
