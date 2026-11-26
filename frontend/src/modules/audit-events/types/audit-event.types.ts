import type { AuditAction } from "./audit-action.types";
import type { AuditResponsible } from "./audit-responsible.types";
import type { AuditEvidence } from "./audit-evidence.types";
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
export type { AuditAction } from "./audit-action.types";
export type { AuditActorRole } from "./audit-actor-role.types";
export type { AuditResponsible } from "./audit-responsible.types";
export type { AuditEvidence } from "./audit-evidence.types";

export type { AuditEventPage } from "./audit-event-page.types";
