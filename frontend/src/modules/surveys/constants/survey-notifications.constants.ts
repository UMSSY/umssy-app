import type { BreadcrumbEntry } from "@/shared/types/breadcrumb-entry.types";
import type { SurveyNotificationStatus, SurveyStatusStyle } from "../types/survey-notification.types";

export const SURVEYS_PATH = "/surveys";
export const SURVEY_NOTIFICATIONS_LABEL = "Notificaciones de encuestas";
export const SURVEY_NOTIFICATIONS_DESCRIPTION = "Consulta los avisos de nuevas encuestas disponibles para ti.";
export const SURVEY_NOTIFICATIONS_LOAD_ERROR_MESSAGE = "No se pudieron cargar tus encuestas. Intenta nuevamente.";
export const SURVEY_NOTIFICATIONS_EMPTY_MESSAGE = "No tienes encuestas por ahora.";

export const SURVEY_NOTIFICATIONS_BREADCRUMB: BreadcrumbEntry[] = [
  { label: "Inicio", href: "/dashboard" },
  { label: SURVEY_NOTIFICATIONS_LABEL },
];

export const SURVEYS_QUERY_KEYS = {
  notifications: ["surveys", "notifications"] as const,
};

export const SURVEY_STATUS_LABELS: Record<SurveyNotificationStatus, string> = {
  pending: "Encuesta pendiente",
  expired: "Encuesta caducada",
  answered: "Encuesta respondida",
};

export const SURVEY_STATUS_STYLES: Record<SurveyNotificationStatus, SurveyStatusStyle> = {
  pending: { iconBox: "bg-danger/10 text-danger", badge: "bg-danger/10 text-danger" },
  expired: { iconBox: "bg-danger/10 text-danger", badge: "bg-danger/10 text-danger" },
  answered: { iconBox: "bg-emerald-50 text-emerald-700", badge: "bg-emerald-50 text-emerald-700" },
};

export const ANSWER_SURVEY_LABEL = "Responder encuesta";
export const SURVEY_DETAILS_LABEL = "Ver detalles";

export const SHORT_MONTHS_ES = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."];
