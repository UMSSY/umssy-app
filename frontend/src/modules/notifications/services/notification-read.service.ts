import { apiClient } from "@/shared/services/api-client";

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/notifications/${encodeURIComponent(notificationId)}/read`);
}
