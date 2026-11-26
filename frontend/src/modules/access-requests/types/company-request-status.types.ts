export interface CompanyRequestStatusResponse {
  requestCode: string | null;
  companyName: string;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  reason: string | null;
  canResubmit: boolean;
}
