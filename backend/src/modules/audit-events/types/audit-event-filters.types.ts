import type { AuditActionName } from './audit-action.enum.js';

export interface AuditEventFilters {
  search?: string;
  action?: AuditActionName;
  responsibleId?: string;
  from?: string;
  to?: string;
}
