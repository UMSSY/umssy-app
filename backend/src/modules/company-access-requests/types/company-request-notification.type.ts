import type { NotificationType } from '../../notifications/types/notification-type.enum.js';
import type { NotifyRequest } from '../../notifications/types/notify-request.type.js';

export type CompanyRequestNotification<K extends NotificationType> = Pick<
  Extract<NotifyRequest, { type: K }>,
  'type' | 'payload' | 'renderMail'
>;
