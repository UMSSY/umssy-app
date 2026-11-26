import type { VerificationJob } from './verification-job.types.js';
export type VerificationDocumentContext = VerificationJob & {
  firstName: string;
  lastName: string;
  issuer: string | null;
};
