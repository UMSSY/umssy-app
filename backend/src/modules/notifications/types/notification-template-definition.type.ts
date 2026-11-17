import type { NotificationType } from './notification-type.enum.js';
import type { NotificationPayloadMap } from './notification-payload-map.type.js';
import type { NotificationMailContent } from './notification-mail-content.type.js';
import type { NotificationMailContext } from './notification-mail-context.type.js';

export type NotificationTemplateDefinition<K extends NotificationType> = {
  renderTitle: (payload: NotificationPayloadMap[K]) => string;
  renderBody: (payload: NotificationPayloadMap[K]) => string;
  renderMail?: (
    payload: NotificationPayloadMap[K],
    context: NotificationMailContext,
  ) => NotificationMailContent;
};
