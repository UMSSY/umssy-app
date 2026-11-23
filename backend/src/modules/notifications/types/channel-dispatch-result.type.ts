import type { NotificationChannelStatus } from './notification-channel-status.type.js';
import type { NotificationRecipientDelivery } from './notification-recipient-delivery.type.js';

export interface ChannelDispatchResult {
  status: NotificationChannelStatus;
  deliveries: NotificationRecipientDelivery[];
}
