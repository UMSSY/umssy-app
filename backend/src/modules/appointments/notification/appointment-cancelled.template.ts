import type { NotificationEmailContent } from '../../notifications/types/notification-email-content.type.js';
import type { NotificationPayloadMap } from '../../notifications/types/notification-payload-map.type.js';
import type { NotificationTemplateDefinition } from '../../notifications/types/notification-template-definition.type.js';
import type { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { truncateNotificationText } from '../../notifications/utils/truncate-notification-text.js';
import { APPOINTMENT_BOOKED_TIME_ZONE_LABEL } from '../constants/appointment-booked-notification.constants.js';
import {
  APPOINTMENT_CANCELLED_EMAIL_SUBJECT,
  APPOINTMENT_CANCELLED_EMAIL_TEMPLATE,
  APPOINTMENT_CANCELLED_NOTIFICATION_TITLE,
  APPOINTMENT_CANCELLED_WITH_REASON_EMAIL_TEMPLATE,
} from '../constants/appointment-cancelled-notification.constants.js';

type AppointmentCancelledPayload =
  NotificationPayloadMap[NotificationType.APPOINTMENT_CANCELLED];

const renderBody = (payload: AppointmentCancelledPayload): string =>
  truncateNotificationText(
    `${payload.cancelledByName} canceló la cita con ${payload.counterpartName} el ${payload.date} a las ${payload.time}.`,
  );

const renderEmail = (
  payload: AppointmentCancelledPayload,
  actionUrl: string,
): NotificationEmailContent => {
  const intro = `${payload.cancelledByName} canceló la cita de orientación que tenían agendada.`;
  const time = `${payload.time} (${APPOINTMENT_BOOKED_TIME_ZONE_LABEL})`;
  const reason = payload.reason?.trim();
  const values: Record<string, string> = {
    intro,
    cancelledByName: payload.cancelledByName,
    date: payload.date,
    time,
    actionUrl,
  };

  return {
    template: reason
      ? APPOINTMENT_CANCELLED_WITH_REASON_EMAIL_TEMPLATE
      : APPOINTMENT_CANCELLED_EMAIL_TEMPLATE,
    subject: APPOINTMENT_CANCELLED_EMAIL_SUBJECT,
    text: [
      intro,
      `Canceló: ${payload.cancelledByName}`,
      `Fecha: ${payload.date}`,
      `Hora: ${time}`,
      ...(reason ? [`Motivo: ${reason}`] : []),
      `Ver mis citas: ${actionUrl}`,
    ].join('\n'),
    values: reason ? { ...values, reason } : values,
  };
};

export const APPOINTMENT_CANCELLED_TEMPLATE: NotificationTemplateDefinition<NotificationType.APPOINTMENT_CANCELLED> =
  {
    renderTitle: () => APPOINTMENT_CANCELLED_NOTIFICATION_TITLE,
    renderBody,
    renderEmail,
  };
