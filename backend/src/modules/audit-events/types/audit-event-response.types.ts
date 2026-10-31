import type { AuditActionName } from './audit-action.enum.js';
import type { AuditActorRole } from './audit-actor-role.enum.js';

export interface AuditResponsibleResponse {
  id: string | null;
  name: string;
  role: AuditActorRole;
}

export interface AuditEvidenceResponse {
  name: string;
  extension: string;
  mimeType: string;
  size: number;
}

export interface AuditEventListItemResponse {
  id: string;
  code: string;
  occurredAt: string;
  request: { id: string; code: string };
  applicantName: string;
  action: AuditActionName;
  responsible: AuditResponsibleResponse;
  detail: string | null;
  evidence: AuditEvidenceResponse | null;
}

export interface AuditResponsibleOptionResponse {
  id: string;
  name: string;
}
