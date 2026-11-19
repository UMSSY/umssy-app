export type NotificationChannel = 'push' | 'email' | 'in_app';

export type StoredChannelPreference = {
  pushEnabled: boolean;
  emailEnabled: boolean;
};

export const DEFAULT_NOTIFICATION_CHANNEL: NotificationChannel = 'email';

export function resolveNotificationChannel(
  preference: StoredChannelPreference | null | undefined,
): NotificationChannel {
  if (!preference) return DEFAULT_NOTIFICATION_CHANNEL;
  if (preference.pushEnabled) return 'push';
  if (preference.emailEnabled) return 'email';
  return 'in_app';
}