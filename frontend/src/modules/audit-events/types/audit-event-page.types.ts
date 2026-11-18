import type { AuditEvent } from "./audit-event.types";

export interface AuditEventPage {
  items: AuditEvent[];
  total: number;
  page: number;
  limit: number;
}
