import type { AuditAction } from "./audit-action.types";
import type { AuditEvidence } from "./audit-evidence.types";
import type { AuditResponsible } from "./audit-responsible.types";

export interface AuditEventApplicant {
  fullName: string;
  career: string;
  graduationYear: number;
}

export interface AuditEventDetail {
  id: string;
  code: string;
  occurredAt: string;
  action: AuditAction;
  request: { id: string; code: string };
  applicant: AuditEventApplicant;
  responsible: AuditResponsible;
  rejectionReason: string | null;
  documentType: string | null;
  evidence: AuditEvidence | null;
}
