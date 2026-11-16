import type { NotificationType } from './notification-type.enum.js';
import type { NotificationPayloadMap } from './notification-payload-map.type.js';

export type NotificationTemplateDefinition<K extends NotificationType> = {
  renderTitle: (payload: NotificationPayloadMap[K]) => string;
  renderBody: (payload: NotificationPayloadMap[K]) => string;
};