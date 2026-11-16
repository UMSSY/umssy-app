import type { VerificationJob } from './document-verification.type.js';
export type ClaimedVerificationJob = Omit<
  VerificationJob,
  'firstName' | 'lastName' | 'issuer'
>;
