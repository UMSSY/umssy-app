import type { NotificationType } from "../types/notification-type.types";

export const NOTIFICATION_ACTION_LABELS: Record<NotificationType, string> = {
  CHAT_MESSAGE: "Ver mensaje",
  CHAT_GROUP_MESSAGE: "Ver mensaje",
  CONNECTION_REQUEST_RECEIVED: "Ver solicitud",
  CONNECTION_REQUEST_ACCEPTED: "Ir a la sala de chat",
  MENTOR_SLOT_OFFERED: "Ver oferta",
  RADAR_PUBLISHED: "Ver radar",
  APPOINTMENT_CANCELLED: "Ver cita",
  APPOINTMENT_BOOKED: "Ver cita",
  SURVEY_PUBLISHED: "Responder encuesta",
  SURVEY_REMINDER: "Responder encuesta",
  SURVEY_CLOSING_SOON: "Ver analíticas",
  SURVEY_CLOSED: "Ver resultados",
  SURVEY_VARIATION_ALERT: "Ver detalle",
  APPLICATION_STATUS_CHANGED: "Ver postulación",
  NEW_JOB_APPLICANT: "Ver postulantes",
  EVENT_STARTING_SOON: "Ver evento",
  ACCESS_REQUEST_APPROVED: "Ver perfil",
};

export const DEFAULT_NOTIFICATION_ACTION_LABEL = "Ver detalle";