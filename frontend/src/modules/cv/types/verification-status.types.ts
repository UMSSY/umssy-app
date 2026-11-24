export type VerificationStatus =
  | 'queued'
  | 'reading'
  | 'approved'
  | 'review'
  | 'low_confidence'
  | 'manual_approved'
  | 'manual_rejected'
  | 'cancelled'
  | 'legacy';
