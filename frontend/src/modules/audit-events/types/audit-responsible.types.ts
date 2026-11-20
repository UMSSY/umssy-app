import type { AuditActorRole } from "./audit-actor-role.types";

export interface AuditResponsible {
  id: string | null;
  name: string;
  role: AuditActorRole;
}
