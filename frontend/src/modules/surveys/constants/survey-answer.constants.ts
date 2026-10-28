import type { QuestionType } from "../types/survey.types";

export const SURVEY_ANSWER_REDIRECT_DELAY_MS = 1500;

export const SURVEY_ANSWER_HINTS: Readonly<Record<QuestionType, string>> = {
  single_choice: "Selecciona una opción",
  multiple_choice: "Selecciona una o más opciones",
};

export const SURVEY_ANSWER_TEXT = {
  audienceBadge: "Encuesta para Titulados",
  closesAtPrefix: "Vence el:",
  requiredNotice: "Los campos marcados con * son obligatorios.",
  backToSurveys: "Volver a encuestas",
  backToNotifications: "Volver a notificaciones de encuestas",
  backToSurveyList: "Volver a la lista de encuestas",
  cancel: "Cancelar",
  submit: "Enviar respuestas",
  submitting: "Enviando respuestas...",
  loadErrorTitle: "No se pudo cargar la encuesta",
  loadErrorDescription: "La encuesta no existe o no se encuentra disponible.",
  completedTitle: "¡Encuesta completada!",
  completedDescription: (title: string) =>
    `Tus respuestas para “${title}” han sido registradas correctamente. Muchas gracias por tu valiosa participación.`,
  expiredTitle: "Encuesta caducada",
  expiredDescription: (title: string) =>
    `El plazo para responder “${title}” ha finalizado y ya no admite nuevas respuestas.`,
  requiredQuestion: "Esta pregunta es obligatoria. Por favor selecciona una opción.",
  submitSuccess: "¡Respuestas registradas exitosamente!",
  submitError: "Ocurrió un error al enviar las respuestas",
} as const;
