import type { AuditActionName } from './audit-action.enum.js';
import type {
  AuditEvidenceResponse,
  AuditResponsibleResponse,
} from './audit-event-response.types.js';

export interface AuditEventApplicantResponse {
  fullName: string;
  career: string;
  graduationYear: number;
}

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
