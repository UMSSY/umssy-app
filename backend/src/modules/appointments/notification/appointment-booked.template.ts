import { PUSH_TEXT_MAX_LENGTH } from '../../notifications/constants/push-notification.constants.js';
import type { NotificationEmailContent } from '../../notifications/types/notification-email-content.type.js';
import type { NotificationPayloadMap } from '../../notifications/types/notification-payload-map.type.js';
import type { NotificationTemplateDefinition } from '../../notifications/types/notification-template-definition.type.js';
import type { NotificationType } from '../../notifications/types/notification-type.enum.js';
import {
  APPOINTMENT_BOOKED_EMAIL_SUBJECT,
  APPOINTMENT_BOOKED_EMAIL_TEMPLATE,
  APPOINTMENT_BOOKED_NOTIFICATION_TITLE,
  APPOINTMENT_BOOKED_TIME_ZONE_LABEL,
} from '../constants/appointment-booked-notification.constants.js';
import { AppointmentParticipantRole } from '../enums/appointment-participant-role.enum.js';

type AppointmentBookedPayload =
  NotificationPayloadMap[NotificationType.APPOINTMENT_BOOKED];

const ELLIPSIS = '...';

// Texto del aviso según quién lo recibe; name es la otra persona.
const bodyFor = (payload: AppointmentBookedPayload, name: string): string =>
  payload.recipientRole === AppointmentParticipantRole.MENTOR
    ? `${name} reservó una cita contigo para el ${payload.date} a las ${payload.time}.`
    : `Tu cita con ${name} quedó confirmada para el ${payload.date} a las ${payload.time}.`;

// Si el texto supera el límite del push, se acorta solo el nombre para que la
// fecha y la hora sigan visibles.
const renderBody = (payload: AppointmentBookedPayload): string => {
  const body = bodyFor(payload, payload.counterpartName);
  if (body.length <= PUSH_TEXT_MAX_LENGTH) {
    return body;
  }
  const fixedLength = bodyFor(payload, '').length;
  const nameLength = Math.max(
    PUSH_TEXT_MAX_LENGTH - fixedLength - ELLIPSIS.length,
    0,
  );
  // Se corta por caracteres completos para no partir un emoji en dos.
  const characters = Array.from(payload.counterpartName);
  let kept = '';
  for (const character of characters) {
    if (kept.length + character.length > nameLength) {
      break;
    }
    kept += character;
  }
  const name = `${kept.trimEnd()}${ELLIPSIS}`;
  return bodyFor(payload, name);
};

// Correo «Cita confirmada»: la otra persona se nombra según el rol de quien lo recibe.
const renderEmail = (
  payload: AppointmentBookedPayload,
  actionUrl: string,
): NotificationEmailContent => {
  const isMentor = payload.recipientRole === AppointmentParticipantRole.MENTOR;
  const counterpartLabel = isMentor ? 'Titulado' : 'Mentor';
  const intro = isMentor
    ? `${payload.counterpartName} reservó una cita de orientación contigo.`
    : `Tu cita de orientación con ${payload.counterpartName} quedó confirmada.`;
  const time = `${payload.time} (${APPOINTMENT_BOOKED_TIME_ZONE_LABEL})`;

  return {
    template: APPOINTMENT_BOOKED_EMAIL_TEMPLATE,
    subject: APPOINTMENT_BOOKED_EMAIL_SUBJECT,
    text: [
      intro,
      `${counterpartLabel}: ${payload.counterpartName}`,
      `Fecha: ${payload.date}`,
      `Hora: ${time}`,
      `Tema: ${payload.topic}`,
      `Ver mis citas: ${actionUrl}`,
    ].join('\n'),
    values: {
      intro,
      counterpartLabel,
      counterpartName: payload.counterpartName,
      date: payload.date,
      time,
      topic: payload.topic,
      actionUrl,
    },
  };
};

export const APPOINTMENT_BOOKED_TEMPLATE: NotificationTemplateDefinition<NotificationType.APPOINTMENT_BOOKED> =
  {
    renderTitle: () => APPOINTMENT_BOOKED_NOTIFICATION_TITLE,
    renderBody,
    renderEmail,
  };
