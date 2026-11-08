import { SESSION_DRAFT_STORAGE_PREFIX } from "@/modules/auth";
import type { BreadcrumbEntry } from "@/shared/types/breadcrumb-entry.types";
import type { QuestionType } from "../types/question-type.types";
import { SURVEY_NOTIFICATIONS_LABEL, SURVEY_NOTIFICATIONS_PATH } from "./survey-notifications.constants";

export const SURVEY_ANSWERS_STORAGE_KEY = (surveyId: string) => `${SESSION_DRAFT_STORAGE_PREFIX}survey-answers:${surveyId}`;

export const SURVEY_ANSWER_BREADCRUMB: BreadcrumbEntry[] = [
  { label: "Inicio", href: "/dashboard" },
  { label: SURVEY_NOTIFICATIONS_LABEL, href: SURVEY_NOTIFICATIONS_PATH },
];

export const SURVEY_ANSWER_HINTS: Readonly<Record<QuestionType, string>> = {
  single_choice: "Selecciona una opción",
  multiple_choice: "Selecciona una o más opciones",
  dropdown: "Selecciona una opción de la lista",
};

export const SURVEY_ANSWER_TEXT = {
  audienceBadge: "Encuesta para Titulados",
  closesAtPrefix: "Vence el:",
  dropdownPlaceholder: "Selecciona una opción",
  requiredNotice: "Los campos marcados con * son obligatorios.",
  backToSurveys: "Volver a encuestas",
  backToNotifications: "Volver a notificaciones de encuestas",
  backToSurveyList: "Volver a la lista de encuestas",
  cancel: "Cancelar",
  submit: "Finalizar y Enviar",
  submitting: "Enviando respuestas...",
  loadErrorTitle: "No se pudo cargar la encuesta",
  loadErrorDescription: "La encuesta no existe o no se encuentra disponible.",
  completedTitle: "¡Encuesta completada!",
  completedDescription: (title: string) =>
    `Tus respuestas para “${title}” han sido registradas correctamente. Muchas gracias por tu valiosa participación.`,
  expiredTitle: "Encuesta caducada",
  expiredDescription: (title: string) =>
    `El plazo para responder “${title}” ha finalizado y ya no admite nuevas respuestas.`,
  requiredQuestion: "Esta pregunta es obligatoria.",
  missingAnswers: "Responde todas las preguntas obligatorias antes de enviar.",
  submitSuccess: "¡Respuestas registradas exitosamente!",
  submitError: "Ocurrió un error al enviar las respuestas",
} as const;
