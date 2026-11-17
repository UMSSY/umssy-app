import type { NotificationType } from './notification-type.enum.js';
import type { NotificationPayloadMap } from './notification-payload-map.type.js';
import type { NotificationEmailContent } from './notification-email-content.type.js';

export type NotificationTemplateDefinition<K extends NotificationType> = {
  renderTitle: (payload: NotificationPayloadMap[K]) => string;
  renderBody: (payload: NotificationPayloadMap[K]) => string;
  // Opcional: correo propio del tipo. Sin él se usa la plantilla genérica notification.mjml.
  renderEmail?: (
    payload: NotificationPayloadMap[K],
    actionUrl: string,
  ) => NotificationEmailContent;
};
