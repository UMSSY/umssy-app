export type AccessRequestStatus =
  | "DRAFT"
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED";

export interface RejectionReasonNoticeProps {
  status: AccessRequestStatus;
  rejectionReason?: string | null;
}
