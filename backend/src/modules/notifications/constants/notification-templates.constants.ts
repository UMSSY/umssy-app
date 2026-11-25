import { APPOINTMENT_BOOKED_TEMPLATE } from '../../appointments/notification/appointment-booked.template.js';
import { APPOINTMENT_CANCELLED_TEMPLATE } from '../../appointments/notification/appointment-cancelled.template.js';
import {
  COMPANY_REQUEST_APPROVED_TEMPLATE,
  COMPANY_REQUEST_OBSERVED_TEMPLATE,
  COMPANY_REQUEST_REJECTED_TEMPLATE,
} from '../../company-access-requests/notification/company-request-notifications.js';
import { NotificationType } from '../types/notification-type.enum.js';
import type { NotificationTemplateMap } from '../types/notification-template-map.type.js';

import { truncateNotificationText as truncate } from '../utils/truncate-notification-text.js';

export const NOTIFICATION_TEMPLATES: NotificationTemplateMap = {
  [NotificationType.CHAT_MESSAGE]: {
    renderTitle: (p) => `Mensaje nuevo de: ${p.senderName}`,
    renderBody: (p) => {
      const counter = p.messageCount > 1 ? ` (${p.messageCount} mensajes)` : '';
      return truncate(`${p.previewText}${counter}`);
    },
  },
  [NotificationType.CHAT_GROUP_MESSAGE]: {
    renderTitle: (p) => `Mensaje nuevo en: ${p.groupName}`,
    renderBody: (p) => {
      const counter = p.messageCount > 1 ? ` (${p.messageCount} mensajes)` : '';
      return truncate(`${p.senderName}: ${p.previewText}${counter}`);
    },
  },
  [NotificationType.CONNECTION_REQUEST_RECEIVED]: {
    renderTitle: () => 'Nueva solicitud de conexión',
    renderBody: (p) => truncate(`${p.senderName} quiere conectar contigo.`),
  },
  [NotificationType.CONNECTION_REQUEST_ACCEPTED]: {
    renderTitle: () => 'Solicitud de conexión aceptada',
    renderBody: (p) =>
      truncate(`${p.receiverName} ha aceptado tu solicitud de conexión.`),
  },

  [NotificationType.MENTOR_SLOT_OFFERED]: {
    renderTitle: () => 'Cupo disponible para ser mentor',
    renderBody: (p) =>
      truncate(
        `Tienes hasta el ${p.expiresAt} para confirmar tu participación.`,
      ),
  },

  [NotificationType.RADAR_PUBLISHED]: {
    renderTitle: () => 'Nueva versión del Radar publicada',
    renderBody: (p) =>
      truncate(`Tu radar ha sido actualizado (Versión: ${p.radarVersion}).`),
  },

  [NotificationType.APPOINTMENT_CANCELLED]: APPOINTMENT_CANCELLED_TEMPLATE,
  [NotificationType.APPOINTMENT_BOOKED]: APPOINTMENT_BOOKED_TEMPLATE,

  [NotificationType.SURVEY_PUBLISHED]: {
    renderTitle: () => 'Nueva encuesta publicada',
    renderBody: (p) =>
      truncate(`La encuesta "${p.surveyTitle}" está disponible.`),
  },
  [NotificationType.SURVEY_REMINDER]: {
    renderTitle: () => 'Recordatorio de encuesta',
    renderBody: (p) => truncate(`Aún no respondiste la encuesta "${p.surveyTitle}".`),
  },
  [NotificationType.SURVEY_CLOSING_SOON]: {
    renderTitle: () => 'Encuesta próxima a cerrar',
    renderBody: (p) => truncate(`La encuesta "${p.surveyTitle}" cierra el ${p.closesAtFormatted}`),
  },
  [NotificationType.SURVEY_CLOSED]: {
    renderTitle: () => 'Encuesta cerrada',
    renderBody: (p) => truncate(`La encuesta "${p.surveyTitle}" cerró con ${p.responsesCount} respuestas.`),
  },
  [NotificationType.SURVEY_VARIATION_ALERT]: {
    renderTitle: () => 'Alerta de variación en encuesta',
    renderBody: (p) => truncate(`Se detectaron cambios significativos en la encuesta "${p.surveyTitle}".`),
  },

  [NotificationType.APPLICATION_STATUS_CHANGED]: {
    renderTitle: () => 'Actualización de postulación',
    renderBody: (p) =>
      truncate(
        `Tu postulación a ${p.vacancyTitle} en ${p.companyName} cambió a: ${p.newStatus}.`,
      ),
  },

  [NotificationType.NEW_JOB_APPLICANT]: {
    renderTitle: () => 'Nuevo postulante',
    renderBody: (p) =>
      truncate(
        `${p.applicantName} se postuló a ${p.jobTitle}. Total: ${p.applicantCount}.`,
      ),
  },

  [NotificationType.EVENT_STARTING_SOON]: {
    renderTitle: () => 'Evento por comenzar',
    renderBody: (p) =>
      truncate(`El evento "${p.eventName}" inicia a las ${p.time}.`),
  },

  [NotificationType.ACCESS_REQUEST_APPROVED]: {
    renderTitle: () => 'Acceso aprobado',
    renderBody: (p) =>
      truncate(`Bienvenido ${p.studentName}, tu cuenta ha sido activada.`),
  },

  [NotificationType.COMPANY_ACCESS_REQUEST_APPROVED]:
    COMPANY_REQUEST_APPROVED_TEMPLATE,
  [NotificationType.COMPANY_ACCESS_REQUEST_OBSERVED]:
    COMPANY_REQUEST_OBSERVED_TEMPLATE,
  [NotificationType.COMPANY_ACCESS_REQUEST_REJECTED]:
    COMPANY_REQUEST_REJECTED_TEMPLATE,
};
