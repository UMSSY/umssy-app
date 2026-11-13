import { NotificationType } from '../types/notification-type.enum.js';

type TemplateDefinition = {
  renderTitle: (payload: any) => string;
  renderBody: (payload: any) => string;
};

const truncate = (text: string, max: number = 100) => 
  text.length > max ? `${text.substring(0, max - 3)}...` : text;

export const NOTIFICATION_TEMPLATES: Record<NotificationType, TemplateDefinition> = {
  [NotificationType.CHAT_MESSAGE]: {
    renderTitle: (p) => `Mensaje nuevo de: ${p.senderName}`,
    renderBody: (p) => truncate(`${p.previewText} (${p.messageCount} mensajes)`),
  },
  [NotificationType.CHAT_GROUP_MESSAGE]: {
    renderTitle: (p) => `Mensaje nuevo en: ${p.groupName}`,
    renderBody: (p) => truncate(`${p.senderName}: ${p.previewText} (${p.messageCount} mensajes)`),
  },
  [NotificationType.CONNECTION_REQUEST_RECEIVED]: {
    renderTitle: () => 'Nueva solicitud de conexión',
    renderBody: (p) => truncate(`${p.senderName} quiere conectar contigo.`),
  },
  [NotificationType.CONNECTION_REQUEST_ACCEPTED]: {
    renderTitle: () => 'Solicitud aceptada',
    renderBody: (p) => truncate(`${p.receiverName} ha aceptado tu solicitud.`),
  },

  [NotificationType.MENTOR_SLOT_OFFERED]: {
    renderTitle: () => 'Cupo disponible para ser mentor',
    renderBody: (p) => truncate(`Tienes hasta el ${p.expiresAt} para confirmar tu participación.`),
  },

  [NotificationType.RADAR_PUBLISHED]: {
    renderTitle: () => 'Nueva versión del Radar publicada',
    renderBody: (p) => truncate(`Tu radar ha sido actualizado (Versión: ${p.radarVersion}).`),
  },

  [NotificationType.APPOINTMENT_CANCELLED]: {
    renderTitle: () => 'Cita cancelada',
    renderBody: (p) => truncate(`${p.cancelledByName} canceló la cita con ${p.counterpartName} el ${p.date}.`),
  },
  [NotificationType.APPOINTMENT_BOOKED]: {
    renderTitle: () => 'Cita confirmada',
    renderBody: (p) => truncate(`Cita con ${p.counterpartName} el ${p.date} a las ${p.time}.`),
  },

  [NotificationType.SURVEY_PUBLISHED]: {
    renderTitle: () => 'Nueva encuesta publicada',
    renderBody: (p) => truncate(`La encuesta "${p.surveyTitle}" está disponible.`),
  },

  [NotificationType.APPLICATION_STATUS_CHANGED]: {
    renderTitle: () => 'Actualización de postulación',
    renderBody: (p) => truncate(`Tu postulación a ${p.vacancyTitle} en ${p.companyName} cambió a: ${p.newStatus}.`),
  },

  [NotificationType.NEW_JOB_APPLICANT]: {
    renderTitle: () => 'Nuevo postulante',
    renderBody: (p) => truncate(`${p.applicantName} se postuló a ${p.jobTitle}. Total: ${p.applicantCount}.`),
  },

  [NotificationType.EVENT_STARTING_SOON]: {
    renderTitle: () => 'Evento por comenzar',
    renderBody: (p) => truncate(`El evento "${p.eventName}" inicia a las ${p.time}.`),
  },

  [NotificationType.ACCESS_REQUEST_APPROVED]: {
    renderTitle: () => 'Acceso aprobado',
    renderBody: (p) => truncate(`Bienvenido ${p.studentName}, tu cuenta ha sido activada.`),
  },
};