import type { ReactNode } from "react";
import type { NotificationInboxFilter } from "./notification-inbox-filter.types";

export interface NotificationsViewProps {
  filter?: NotificationInboxFilter;
  filterSections?: Partial<Record<NotificationInboxFilter, ReactNode>>;
}
