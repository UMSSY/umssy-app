export const AUDIT_ACTION = {
  SUBMITTED: 'submitted',
  OPENED: 'opened',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVATION_CODE_SENT: 'activation_code_sent',
  ACCOUNT_ACTIVATED: 'account_activated',
  DOCUMENT_REPLACED: 'document_replaced',
} as const;

export type AuditActionName = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];
