import { toBoliviaTime } from '../../../common/utils/date-time.js';

export function buildAuditEventCode(number: number, occurredAt: Date): string {
  const { year } = toBoliviaTime(occurredAt);
  return `EVT-${year}-${String(number).padStart(6, '0')}`;
}
