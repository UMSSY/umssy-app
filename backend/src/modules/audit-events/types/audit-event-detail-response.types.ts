import type { AuditActionName } from './audit-action.enum.js';
import type {
  AuditEvidenceResponse,
  AuditResponsibleResponse,
} from './audit-event-response.types.js';
import type { AuditEventApplicantResponse } from './audit-event-applicant-response.types.js';

export type { AuditEventApplicantResponse };

export interface AuditEventDetailResponse {
  id: string;
  code: string;
  occurredAt: string;
  action: AuditActionName;
  request: { id: string; code: string };
  applicant: AuditEventApplicantResponse;
  responsible: AuditResponsibleResponse;
  rejectionReason: string | null;
  documentType: string | null;
  evidence: AuditEvidenceResponse | null;
}
