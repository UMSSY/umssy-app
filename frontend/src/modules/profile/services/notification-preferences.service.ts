import { apiClient } from '@/shared/services/api-client';
import type {
  NotificationPreferenceResponse,
  UpdateNotificationPreferencePayload,
} from '../types/notification-preference.types';

export async function getNotificationPreferences(): Promise<NotificationPreferenceResponse> {
  const response = await apiClient.get<NotificationPreferenceResponse>(
    '/notifications/preferences',
  );
  
  return response.data;
}

export async function updateNotificationPreferences(
  payload: UpdateNotificationPreferencePayload,
): Promise<void> {
  await apiClient.put('/notifications/preferences', payload);
}