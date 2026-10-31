import type { Prisma } from '../../../prisma/client.js';
import { SYSTEM_RESPONSIBLE_ID } from '../constants/audit-events.constants.js';
import { AUDIT_ACTOR_ROLE } from '../types/audit-actor-role.enum.js';
import type { AuditEventFilters } from '../types/audit-event-filters.types.js';
import { toBoliviaDayRange } from './to-bolivia-day-range.js';

// Misma construcción para el listado y la exportación: ambos deben devolver el mismo conjunto
export function buildAuditEventsWhere(filters: AuditEventFilters): Prisma.AuditEventWhereInput {
  const conditions: Prisma.AuditEventWhereInput[] = [];

  if (filters.search) {
    conditions.push({
      OR: [
        { requestCode: { contains: filters.search, mode: 'insensitive' } },
        { applicantName: { contains: filters.search, mode: 'insensitive' } },
      ],
    });
  }
  if (filters.action) {
    conditions.push({ action: { title: filters.action } });
  }
  if (filters.responsibleId === SYSTEM_RESPONSIBLE_ID) {
    conditions.push({ actorRole: AUDIT_ACTOR_ROLE.SYSTEM });
  } else if (filters.responsibleId) {
    conditions.push({ actorId: filters.responsibleId });
  }
  if (filters.from || filters.to) {
    conditions.push({ occurredAt: toBoliviaDayRange(filters.from, filters.to) });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}
