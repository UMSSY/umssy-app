import type { NotificationMailContent } from './notification-mail-content.type.js';
import type { NotificationMailContext } from './notification-mail-context.type.js';

export type NotificationMailRenderer = (
  context: NotificationMailContext,
) => Promise<NotificationMailContent>;
