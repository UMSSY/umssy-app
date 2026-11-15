export type NotificationChannel = 'push' | 'email' | 'in-app';

export interface NotificationPreferenceResponse {
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

export interface UpdateNotificationPreferencePayload {
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}