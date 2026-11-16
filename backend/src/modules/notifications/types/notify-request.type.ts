import { NotificationType } from './notification-type.enum.js';
import type { NotificationPayloadMap } from './notification-payload-map.type.js';

export type NotifyRequest = {
  [K in NotificationType]: {
    recipientIds: string[];
    actorId?: string;
    type: K;
    payload: NotificationPayloadMap[K];
    actionUrl: string;
    groupKey?: string;
  };
}[NotificationType];