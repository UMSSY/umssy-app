import type { NotificationEmailContent } from './notification-email-content.type.js';

// Arma el correo propio de un tipo con el enlace absoluto que calcula el MailDispatcher.
export type NotificationEmailRenderer = (
  absoluteActionUrl: string,
) => NotificationEmailContent;
