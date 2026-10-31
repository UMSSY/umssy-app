export type ForgotPasswordStep = "request" | "verify" | "reset" | "success";

export interface RequestResetCodePayload {
  email: string;
}

export interface VerifyResetCodePayload {
  email: string;
  code: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  password: string;
}

export type PasswordResetResult = { ok: true } | { ok: false; error: string };
