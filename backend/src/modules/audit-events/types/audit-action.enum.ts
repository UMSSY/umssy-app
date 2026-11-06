export const AUDIT_ACTION = {
  SUBMITTED: 'submitted',
  OPENED: 'opened',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVATION_CODE_SENT: 'activation_code_sent',
  ACCOUNT_ACTIVATED: 'account_activated',
  DOCUMENT_REPLACED: 'document_replaced',
  OCR_READ: 'ocr_read',
  SENT_TO_MANUAL_REVIEW: 'sent_to_manual_review',
  APPROVAL_REVERTED: 'approval_reverted',
} as const;

export type AuditActionName = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];
