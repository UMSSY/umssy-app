import { apiClient } from '@/shared/services/api-client';
import type { NotificationPreferenceResponse } from '@/modules/notifications';
import type { ApiResponse } from '../types/api-response.types';
import type { UpdateNotificationPreferencePayload } from '../types/update-notification-preference-payload.types';

export async function getNotificationPreferences(): Promise<NotificationPreferenceResponse> {
  const response = await apiClient.get<ApiResponse<NotificationPreferenceResponse>>(
    '/notifications/preferences',
  );

  return response.data.data;
}

export async function updateNotificationPreferences(
  payload: UpdateNotificationPreferencePayload,
): Promise<void> {
  await apiClient.put('/notifications/preferences', payload);
}