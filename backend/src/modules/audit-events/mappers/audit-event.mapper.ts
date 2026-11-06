import type { Prisma } from '../../../prisma/client.js';
import { SYSTEM_ACTOR_NAME, SYSTEM_RESPONSIBLE_ID } from '../constants/audit-events.constants.js';
import type { AUDIT_EVENT_LIST_SELECT } from '../constants/audit-event-selects.constants.js';
import { buildAuditEventCode } from '../helpers/build-audit-event-code.js';
import type { AuditActionName } from '../types/audit-action.enum.js';
import type { AuditActorRole } from '../types/audit-actor-role.enum.js';
import type {
  AuditEventListItemResponse,
  AuditResponsibleOptionResponse,
  AuditResponsibleResponse,
} from '../types/audit-event-response.types.js';

type AuditEventListRow = Prisma.AuditEventGetPayload<{ select: typeof AUDIT_EVENT_LIST_SELECT }>;

export function toAuditResponsible(row: { actorId: string | null; actorName: string; actorRole: string }): AuditResponsibleResponse {
  return { id: row.actorId, name: row.actorName, role: row.actorRole as AuditActorRole };
}

export function toAuditEventListItem(row: AuditEventListRow): AuditEventListItemResponse {
  const { evidenceFile } = row;
  return {
    id: row.id,
    code: buildAuditEventCode(row.number, row.occurredAt),
    occurredAt: row.occurredAt.toISOString(),
    request: { id: row.accessRequestId, code: row.requestCode },
    applicantName: row.applicantName,
    action: row.action.title as AuditActionName,
    responsible: toAuditResponsible(row),
    detail: row.detail,
    evidence: evidenceFile
      ? { name: evidenceFile.name, extension: evidenceFile.extension, mimeType: evidenceFile.mimeType, size: evidenceFile.size }
      : null,
  };
}

export function toAuditResponsibleOptions(result: {
  people: { actorId: string | null; actorName: string }[];
  hasSystemEvents: boolean;
}): AuditResponsibleOptionResponse[] {
  const people = result.people
    .flatMap((person) => (person.actorId ? [{ id: person.actorId, name: person.actorName }] : []))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return result.hasSystemEvents ? [...people, { id: SYSTEM_RESPONSIBLE_ID, name: SYSTEM_ACTOR_NAME }] : people;
}
