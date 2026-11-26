import { NOTIFICATION_INBOX_FILTER_SLUGS } from "../constants/notification-inbox-filters.constants";
import type { NotificationInboxFilter } from "../types/notification-inbox-filter.types";

export function getNotificationInboxFilterFromSlug(
  slug: string,
): Exclude<NotificationInboxFilter, "ALL"> | null {
  const entry = Object.entries(NOTIFICATION_INBOX_FILTER_SLUGS).find(
    ([, value]) => value === slug,
  );
  return entry ? (entry[0] as Exclude<NotificationInboxFilter, "ALL">) : null;
}