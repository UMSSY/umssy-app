import type { SurveyNotificationStatus } from "../types/survey-notification.types";

export const SURVEYS_PATH = "/surveys";
export const SURVEY_NOTIFICATIONS_LABEL = "Notificaciones de encuestas";
export const SURVEY_NOTIFICATIONS_DESCRIPTION = "Consulta los avisos de nuevas encuestas disponibles para ti.";
export const SURVEY_NOTIFICATIONS_LOAD_ERROR_MESSAGE = "No se pudieron cargar tus encuestas. Intenta nuevamente.";
export const SURVEY_NOTIFICATIONS_EMPTY_TITLE = "No hay encuestas disponibles";
export const SURVEY_NOTIFICATIONS_EMPTY_DESCRIPTION = "Cuando tengas una nueva encuesta asignada, aparecerá aquí.";

// Trazos decorativos alrededor del icono del estado vacío.
export const EMPTY_STATE_RAY_CLASSES = [
  "-left-7 top-1/2 -translate-y-1/2",
  "-right-7 top-1/2 -translate-y-1/2",
  "-left-4 top-3 -rotate-45",
  "-right-4 top-3 rotate-45",
  "-left-4 bottom-3 rotate-45",
  "-right-4 bottom-3 -rotate-45",
];

export const SURVEYS_QUERY_KEYS = {
  notifications: ["surveys", "notifications"] as const,
};

export const SURVEY_STATUS_LABELS: Record<SurveyNotificationStatus, string> = {
  pending: "Encuesta pendiente",
  expired: "Encuesta caducada",
  answered: "Encuesta registrada",
};

export const SURVEY_STATUS_MESSAGES: Record<SurveyNotificationStatus, string> = {
  pending: "Nueva encuesta disponible para responder.",
  expired: "Esta encuesta estuvo disponible por un tiempo limitado.",
  answered: "Gracias por completar la encuesta. Tu información ha sido registrada correctamente.",
};

export const SURVEY_STATUS_TONES: Record<SurveyNotificationStatus, string> = {
  pending: "bg-danger/10 text-danger",
  expired: "bg-danger/10 text-danger",
  answered: "bg-emerald-50 text-emerald-700",
};

export const ANSWER_SURVEY_LABEL = "Responder encuesta";

export const SHORT_MONTHS_ES = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."];
