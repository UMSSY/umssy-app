export type ActivationReason =
  | "not_found"
  | "already_activated"
  | "code_invalid"
  | "code_expired"
  | "attempts_exceeded"
  | "resend_cooldown"
  | "resend_limit"
  | "code_not_sent";
