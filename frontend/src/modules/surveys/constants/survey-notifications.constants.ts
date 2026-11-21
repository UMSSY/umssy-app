import { getNotificationInboxPath, NOTIFICATION_INBOX_FILTER_LABELS } from "@/modules/notifications";
import type { SurveyNotificationStatus } from "../types/survey-notification-status.types";

export const SURVEY_ANSWER_PATH = "/surveys";
export const SURVEY_NOTIFICATIONS_PATH = getNotificationInboxPath("SURVEYS");
export const SURVEY_NOTIFICATIONS_LABEL = NOTIFICATION_INBOX_FILTER_LABELS.SURVEYS;

export const SURVEY_NOTIFICATIONS_QUERY_KEYS = {
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
  expired: "bg-accent/10 text-accent",
  answered: "bg-availability text-availability-foreground",
};

export const SHORT_MONTHS_ES = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."];
