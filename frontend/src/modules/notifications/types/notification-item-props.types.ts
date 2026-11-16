import type { NotificationResponse } from "./notification-response.types";

export interface NotificationItemProps {
  notification: NotificationResponse;
  onSelect: (notification: NotificationResponse) => void;
}
