import { toBoliviaTime } from '../../../common/utils/date-time.js';
import { AUDIT_EVENT_CODE_DIGITS, AUDIT_EVENT_CODE_PREFIX } from '../constants/audit-events.constants.js';

export function buildAuditEventCode(number: number, occurredAt: Date): string {
  const { year } = toBoliviaTime(occurredAt);
  return `${AUDIT_EVENT_CODE_PREFIX}-${year}-${String(number).padStart(AUDIT_EVENT_CODE_DIGITS, '0')}`;
}
