import type { NotificationPayloadMap } from './notification-payload-map.type.js';
import type { NotificationType } from './notification-type.enum.js';

export type NotificationPayload = NotificationPayloadMap[NotificationType];