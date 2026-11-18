import type { AuditEvent } from "./audit-event.types";

export interface OpenEvidence {
  event: AuditEvent;
  url: string;
}
