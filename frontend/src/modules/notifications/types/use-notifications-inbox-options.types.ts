import type { NotificationInboxFilter } from "./notification-inbox-filter.types";

export interface UseNotificationsInboxOptions {
  filter?: NotificationInboxFilter;
  page?: number;
  limit?: number;
}
