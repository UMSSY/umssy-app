import type { SurveyStatus } from "../types/survey.types";

// Transiciones permitidas entre estados. Borrador solo pasa a Publicada; Publicada y Cerrada
// se alternan con el toggle "Activa / Inactiva" del historial.
const ALLOWED_TRANSITIONS: Record<SurveyStatus, SurveyStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["CLOSED"],
  CLOSED: ["PUBLISHED"],
};

export function canChangeSurveyStatus(from: SurveyStatus, to: SurveyStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// Una encuesta publicada ya no se edita, porque los titulados empezaron a responderla.
export function canEditSurvey(status: SurveyStatus): boolean {
  return status === "DRAFT";
}

export function hasSurveyStatistics(status: SurveyStatus): boolean {
  return status !== "DRAFT";
}

export function isSurveyActive(status: SurveyStatus): boolean {
  return status === "PUBLISHED";
}

export function getToggledSurveyStatus(status: SurveyStatus): SurveyStatus | null {
  if (status === "PUBLISHED") return "CLOSED";
  if (status === "CLOSED") return "PUBLISHED";
  return null;
}
