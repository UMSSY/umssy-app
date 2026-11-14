import type { AuditAction } from "./audit-action.types";
import type { AuditEventApplicant } from "./audit-event-applicant.types";
import type { AuditEvidence } from "./audit-evidence.types";
import type { AuditResponsible } from "./audit-responsible.types";

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
