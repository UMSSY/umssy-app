import type { AuditAction } from "./audit-action.types";
import type { AuditActorRole } from "./audit-actor-role.types";

export interface AuditTimelineItem {
  id: string;
  action: AuditAction;
  occurredAt: string;
  actorName: string;
  actorRole: AuditActorRole;
  detail: string | null;
}
