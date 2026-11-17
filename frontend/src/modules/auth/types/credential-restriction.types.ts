import type { CredentialLimit } from "./credential-limit.types";

export interface CredentialRestriction extends CredentialLimit {
  message: string;
}

export interface ActiveCredentialRestriction extends CredentialRestriction {
  remainingSeconds: number;
}

export interface CredentialRestrictionNoticeProps {
  restriction?: ActiveCredentialRestriction | null;
}
