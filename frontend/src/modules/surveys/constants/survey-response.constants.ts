import type { BreadcrumbEntry } from "@/shared/types/breadcrumb-entry.types";
import { SURVEY_NOTIFICATIONS_LABEL, SURVEY_NOTIFICATIONS_PATH } from "./survey-notifications.constants";

export const SURVEY_RESPONSE_BREADCRUMB: BreadcrumbEntry[] = [
  { label: "Inicio", href: "/dashboard" },
  { label: SURVEY_NOTIFICATIONS_LABEL, href: SURVEY_NOTIFICATIONS_PATH },
];

export const SURVEY_RESPONSE_TEXT = {
  submit: "Finalizar y Enviar",
  back: "Volver a mis encuestas",
  multipleChoiceHint: "Puedes seleccionar varias opciones.",
  requiredAnswer: "Esta pregunta es obligatoria.",
  missingAnswers: "Responde todas las preguntas obligatorias antes de enviar.",
  submitSuccess: "Encuesta enviada. Gracias por tu respuesta.",
  loadError: "No se pudo cargar la encuesta. Intenta nuevamente.",
  notFoundTitle: "Encuesta no encontrada",
  notFoundDescription: "La encuesta que buscas no existe o ya no está disponible.",
} as const;

export const SURVEY_RESPONSE_SKELETON_ROWS = 3;

export const SURVEY_RESPONSE_QUERY_KEYS = {
  survey: (id: string) => ["surveys", "to-answer", id] as const,
};
