import {
  AUDIT_ACTION,
  type AuditActionName,
} from '../types/audit-action.enum.js';

const REJECTION_PREFIX = 'Motivo: ';

export function readRejectionReason(
  action: AuditActionName,
  detail: string | null,
): string | null {
  if (action !== AUDIT_ACTION.REJECTED || !detail) return null;
  return detail.startsWith(REJECTION_PREFIX)
    ? detail.slice(REJECTION_PREFIX.length).trim()
    : detail;
}
