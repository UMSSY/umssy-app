import type { NotificationChannel } from './notification-channel.type.js';

export interface NotificationRecipientDelivery {
  recipientId: string;
  channel: NotificationChannel;
  status: 'sent' | 'failed' | 'skipped';
}
