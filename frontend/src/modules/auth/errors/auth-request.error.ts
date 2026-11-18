import type {
  AuthRequestErrorDetails,
  CredentialLimit,
} from "../types/credential-limit.types";

export class AuthRequestError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly credentialLimit: CredentialLimit | null;

  constructor(message: string, details: AuthRequestErrorDetails) {
    super(message);
    this.name = "AuthRequestError";
    this.status = details.status;
    this.code = details.code;
    this.credentialLimit = details.credentialLimit;
  }
}
