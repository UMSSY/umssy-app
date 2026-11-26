export type CredentialOperation = "login" | "request" | "verify" | "reset";

export interface CredentialLimit {
  code: string;
  operation: CredentialOperation;
  retryAfterSeconds: number;
  retryAt: number;
}

export interface AuthRequestErrorDetails {
  status?: number;
  code?: string;
  credentialLimit: CredentialLimit | null;
}
