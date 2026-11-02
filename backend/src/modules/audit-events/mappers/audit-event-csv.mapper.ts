import { toBoliviaTime } from '../../../common/utils/date-time.js';
import { AUDIT_ACTION_LABELS, AUDIT_ACTOR_ROLE_LABELS } from '../constants/audit-action-labels.constants.js';
import { AUDIT_CSV_NO_EVIDENCE } from '../constants/audit-events-export.constants.js';
import type { AuditEventListItemResponse } from '../types/audit-event-response.types.js';

const pad = (value: number) => String(value).padStart(2, '0');

export function formatBoliviaDateTime(iso: string): string {
  const { year, month, day, time } = toBoliviaTime(iso);
  return `${pad(day)}/${pad(month)}/${year} ${time}`;
}

// Fila del CSV: solo texto; la evidencia se indica por su nombre, nunca con el archivo ni con un enlace
export function toAuditEventCsvRow(item: AuditEventListItemResponse): string[] {
  const roleLabel = AUDIT_ACTOR_ROLE_LABELS[item.responsible.role] ?? item.responsible.role;
  return [
    formatBoliviaDateTime(item.occurredAt),
    item.request.code,
    AUDIT_ACTION_LABELS[item.action] ?? item.action,
    `${item.responsible.name} (${roleLabel})`,
    item.detail ?? '',
    item.evidence ? `${item.evidence.name}.${item.evidence.extension}` : AUDIT_CSV_NO_EVIDENCE,
  ];
}
