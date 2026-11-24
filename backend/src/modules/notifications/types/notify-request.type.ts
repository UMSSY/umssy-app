import { NotificationType } from './notification-type.enum.js';
import type { NotificationMailRenderer } from './notification-mail-renderer.type.js';
import type { NotificationPayloadMap } from './notification-payload-map.type.js';
import type { NotifyChannel } from './notify-channel.type.js';

export type NotifyRequest = {
  [K in NotificationType]: {
    recipientIds: string[];
    actorId?: string;
    type: K;
    payload: NotificationPayloadMap[K];
    actionUrl: string;
    groupKey?: string;
    renderMail?: NotificationMailRenderer;
    channels?: NotifyChannel[];
  };
}[NotificationType];
