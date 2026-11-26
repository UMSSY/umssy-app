import {
  NOTIFICATION_INBOX_FILTER_SLUGS,
  NOTIFICATIONS_INBOX_PATH,
} from "../constants/notification-inbox-filters.constants";
import type { NotificationInboxFilter } from "../types/notification-inbox-filter.types";

export function getNotificationInboxPath(filter: NotificationInboxFilter): string {
  return filter === "ALL"
    ? NOTIFICATIONS_INBOX_PATH
    : `${NOTIFICATIONS_INBOX_PATH}/${NOTIFICATION_INBOX_FILTER_SLUGS[filter]}`;
}
