import type { SurveyInput } from "./survey.types";

// Avance del formulario guardado en el navegador para no perderlo si se cierra la vista o se corta internet.
export interface SurveyFormDraft {
  // Id del borrador que se estaba editando, o null si era una encuesta nueva.
  surveyId: string | null;
  values: SurveyInput;
  savedAt: string;
}
