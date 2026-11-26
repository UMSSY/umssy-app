export interface Submission {
  requestCode: string;
  submittedAt: string;
  status: string;
  fullName?: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}
