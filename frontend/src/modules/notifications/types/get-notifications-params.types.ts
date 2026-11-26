import type { NotificationInboxFilter } from "./notification-inbox-filter.types";

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  filter?: NotificationInboxFilter;
}
