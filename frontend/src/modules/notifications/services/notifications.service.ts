import { apiClient } from "@/shared/services/api-client";
import type { GetNotificationsParams } from "../types/get-notifications-params.types";
import type { NotificationInboxFilter } from "../types/notification-inbox-filter.types";
import type { NotificationListResponse } from "../types/notification-list-response.types";
import type { UnreadCountResponse } from "../types/unread-count-response.types";

export type { GetNotificationsParams } from "../types/get-notifications-params.types";

export async function getNotifications(
  params: GetNotificationsParams = {},
): Promise<NotificationListResponse> {
  const { page = 1, limit = 8, filter = "ALL" } = params;
  const response = await apiClient.get<{ data: NotificationListResponse }>("/notifications", {
    params: {
      page,
      limit,
      ...(filter !== "ALL" ? { filter } : {}),
    },
  });

  const inner = response.data?.data;
  return {
    data: Array.isArray(inner?.data) ? inner.data : [],
    page: inner?.page ?? page,
    limit: inner?.limit ?? limit,
    total: inner?.total,
  };
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const response = await apiClient.get<{ data: UnreadCountResponse }>("/notifications/unread-count");
  return { count: response.data?.data?.count ?? 0 };
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${encodeURIComponent(notificationId)}/read`);
}

export async function markAllNotificationsAsRead(
  filter?: NotificationInboxFilter,
): Promise<void> {
  await apiClient.patch(
    "/notifications/read-all",
    filter && filter !== "ALL" ? { filter } : {},
  );
}
