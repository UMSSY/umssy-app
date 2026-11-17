import type { VerificationStatus } from '../types/verification-status.types';
export const isApproved = (status: VerificationStatus) =>
  status === 'approved' || status === 'manual_approved';
