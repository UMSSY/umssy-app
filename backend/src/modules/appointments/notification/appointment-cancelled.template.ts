import { buildFrontendUrl } from '../../access-requests/mail/helpers/frontend-url.js';
import type { NotificationMailContent } from '../../notifications/types/notification-mail-content.type.js';
import type { NotificationMailContext } from '../../notifications/types/notification-mail-context.type.js';
import type { NotificationPayloadMap } from '../../notifications/types/notification-payload-map.type.js';
import type { NotificationTemplateDefinition } from '../../notifications/types/notification-template-definition.type.js';
import type { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { PUSH_TEXT_MAX_LENGTH } from '../../notifications/constants/push-notification.constants.js';
import { APPOINTMENT_BOOKED_TIME_ZONE_LABEL } from '../constants/appointment-booked-notification.constants.js';
import {
  APPOINTMENT_CANCELLED_EMAIL_SUBJECT,
  APPOINTMENT_CANCELLED_NOTIFICATION_TITLE,
} from '../constants/appointment-cancelled-notification.constants.js';
import { loadAppointmentMailTemplate } from './load-appointment-mail-template.js';

type AppointmentCancelledPayload =
  NotificationPayloadMap[NotificationType.APPOINTMENT_CANCELLED];

const renderBody = (payload: AppointmentCancelledPayload): string => {
  const body = `${payload.cancelledByName} canceló la cita con ${payload.counterpartName} el ${payload.date} a las ${payload.time}.`;
  return body.length > PUSH_TEXT_MAX_LENGTH
    ? `${body.substring(0, PUSH_TEXT_MAX_LENGTH - 3)}...`
    : body;
};

export const renderAppointmentCancelledMail = async (
  payload: AppointmentCancelledPayload,
  context: NotificationMailContext,
): Promise<NotificationMailContent> => {
  const actionUrl = buildFrontendUrl(context.actionUrl);
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
    mjml: await loadAppointmentMailTemplate(
      reason ? 'appointment-cancelled-with-reason' : 'appointment-cancelled',
    ),
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
  };
