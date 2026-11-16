import type { VerificationJob } from './verification-job.type.js';
export type VerificationDocumentContext = VerificationJob & {
  firstName: string;
  lastName: string;
  issuer: string | null;
};
