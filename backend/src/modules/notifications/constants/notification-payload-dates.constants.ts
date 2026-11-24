import { formatBoliviaDate, formatBoliviaTime } from '../../../common/utils/date-time.js';
import type { NotificationPayloadDateFormatter } from '../types/notification-payload-date-formatter.type.js';

export const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export const NOTIFICATION_PAYLOAD_DATE_FORMATTERS = {
  date: formatBoliviaDate,
  time: formatBoliviaTime,
  expiresAt: (isoValue: string) =>
    `${formatBoliviaDate(isoValue)} a las ${formatBoliviaTime(isoValue)}`,
} as const satisfies Record<string, NotificationPayloadDateFormatter>;