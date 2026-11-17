import type { CredentialOperation } from "../types/credential-limit.types";

export const CREDENTIAL_LIMIT_OPERATIONS: Record<string, CredentialOperation> = {
  LOGIN_ATTEMPTS_LIMIT: "login",
  PASSWORD_RESET_REQUEST_LIMIT: "request",
  PASSWORD_RESET_VERIFICATION_LIMIT: "verify",
  PASSWORD_RESET_CONFIRMATION_LIMIT: "reset",
  PASSWORD_RESET_COOLDOWN: "request",
};
