import type { AuditActionName } from './audit-action.enum.js';
import type { AuditActorRole } from './audit-actor-role.enum.js';

// Datos del momento del hecho: se copian al evento para que cambios posteriores no los reescriban
export interface RecordAuditEventInput {
  accessRequestId: string;
  requestCode: string;
  applicantName: string;
  applicantCareer: string;
  action: AuditActionName;
  actor: { id: string | null; name: string; role: AuditActorRole };
  detail: string | null;
  evidenceFileId: string | null;
}
