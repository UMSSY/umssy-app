import type { NotificationChannelStatus } from './notification-channel-status.type.js';
import type { NotificationRecipientDelivery } from './notification-recipient-delivery.type.js';

export type NotifyResult = {
  inAppCount: number;
  pushStatus: NotificationChannelStatus;
  emailStatus: NotificationChannelStatus;
  deliveries: NotificationRecipientDelivery[];
};
