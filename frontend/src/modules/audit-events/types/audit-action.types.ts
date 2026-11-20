export type AuditAction =
  | "submitted"
  | "opened"
  | "approved"
  | "rejected"
  | "activation_code_sent"
  | "account_activated"
  | "document_replaced"
  | "ocr_read"
  | "sent_to_manual_review"
  | "approval_reverted";
