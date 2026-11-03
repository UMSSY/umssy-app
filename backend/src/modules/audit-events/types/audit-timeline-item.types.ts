import type { AuditActionName } from './audit-action.enum.js';
import type { AuditActorRole } from './audit-actor-role.enum.js';

export interface AuditTimelineItemResponse {
  id: string;
  action: AuditActionName;
  occurredAt: string;
  actorName: string;
  actorRole: AuditActorRole;
  detail: string | null;
}
