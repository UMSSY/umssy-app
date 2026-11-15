import type { NotificationResponse } from "./notification-response.types";

export interface NotificationListResponse {
  data: NotificationResponse[];
  page: number;
  limit: number;
}
