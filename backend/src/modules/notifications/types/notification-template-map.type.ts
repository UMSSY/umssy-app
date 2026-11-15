import type { NotificationType } from './notification-type.enum.js';
import type { NotificationTemplateDefinition } from './notification-template-definition.type.js';

export type NotificationTemplateMap = {
  [K in NotificationType]: NotificationTemplateDefinition<K>;
};