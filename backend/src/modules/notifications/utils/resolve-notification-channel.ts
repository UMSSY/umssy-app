import type { PreferredNotificationChannel } from '../types/preferred-notification-channel.type.js';
import type { StoredChannelPreference } from '../types/stored-channel-preference.type.js';

const DEFAULT_NOTIFICATION_CHANNEL: PreferredNotificationChannel = 'email';

export function resolveNotificationChannel(
  preference: StoredChannelPreference | null | undefined,
): PreferredNotificationChannel {
  if (!preference) return DEFAULT_NOTIFICATION_CHANNEL;
  if (preference.pushEnabled) return 'push';
  if (preference.emailEnabled) return 'email';
  return 'in_app';
}
