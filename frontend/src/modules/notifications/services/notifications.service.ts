import { apiClient } from "@/shared/services/api-client";
import type { NotificationInboxFilter } from "../types/notification-inbox-filter.types";
import type { NotificationListResponse } from "../types/notification-list-response.types";
import type { UnreadCountResponse } from "../types/unread-count-response.types";

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  filter?: NotificationInboxFilter;
}

export async function getNotifications(
  params: GetNotificationsParams = {},
): Promise<NotificationListResponse> {
  const { page = 1, limit = 8, filter = "ALL" } = params;
  const response = await apiClient.get<NotificationListResponse>("/notifications", {
    params: {
      page,
      limit,
      ...(filter !== "ALL" ? { filter } : {}),
    },
  });

  return {
    data: Array.isArray(response.data?.data) ? response.data.data : [],
    page: response.data?.page ?? page,
    limit: response.data?.limit ?? limit,
    total: response.data?.total,
  };
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const response = await apiClient.get<UnreadCountResponse>("/notifications/unread-count");
  return { count: response.data?.count ?? 0 };
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