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

export type AuditActorRole = "administrativo" | "titulado" | "sistema";

export interface AuditResponsible {
  id: string | null;
  name: string;
  role: AuditActorRole;
}

export interface AuditEvidence {
  name: string;
  extension: string;
  mimeType: string;
  size: number;
}

export interface AuditEvent {
  id: string;
  code: string;
  occurredAt: string;
  request: { id: string; code: string };
  applicantName: string;
  action: AuditAction;
  responsible: AuditResponsible;
  detail: string | null;
  evidence: AuditEvidence | null;
}

export interface AuditEventPage {
  items: AuditEvent[];
  total: number;
  page: number;
  limit: number;
}
