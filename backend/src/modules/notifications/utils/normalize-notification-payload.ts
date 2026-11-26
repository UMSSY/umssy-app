import {
  ISO_DATE_TIME_PATTERN,
  NOTIFICATION_PAYLOAD_DATE_FORMATTERS,
} from '../constants/notification-payload-dates.constants.js';
import type { NotificationPayload } from '../types/notification-payload.type.js';
import type { NotificationPayloadDateField } from '../types/notification-payload-date-field.type.js';
import type { NotificationPayloadDateFormatter } from '../types/notification-payload-date-formatter.type.js';

const DATE_FIELDS = Object.keys(
  NOTIFICATION_PAYLOAD_DATE_FORMATTERS,
) as NotificationPayloadDateField[];

function formatIsoDateTime(
  value: string,
  formatter: NotificationPayloadDateFormatter,
): string {
  if (!ISO_DATE_TIME_PATTERN.test(value)) {
    return value;
  }

  try {
    return formatter(value);
  } catch {
    return value;
  }
}

export function normalizeNotificationPayload<P extends NotificationPayload>(
  payload: P,
): P {
  const normalized: P & Partial<Record<NotificationPayloadDateField, unknown>> = {
    ...payload,
  };

  for (const field of DATE_FIELDS) {
    const value = normalized[field];

    if (typeof value === 'string') {
      normalized[field] = formatIsoDateTime(
        value,
        NOTIFICATION_PAYLOAD_DATE_FORMATTERS[field],
      );
    }
  }

  return normalized;
}