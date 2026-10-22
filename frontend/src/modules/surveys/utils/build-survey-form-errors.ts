import type { SurveyFormErrors, SurveyFormValues } from "../types/survey-form.types";
import type { SurveyValidationMode } from "../types/survey-validation.types";
import { toSurveyInput } from "./survey-form-reducer";
import { validateSurveyInput } from "./validate-survey-input";

// Agrupa los errores de validación: la lista completa para el banner y uno por campo para cada input.
export function buildSurveyFormErrors(values: SurveyFormValues, mode: SurveyValidationMode, today?: string): SurveyFormErrors {
  const list = validateSurveyInput(toSurveyInput(values), mode, today);
  const byField: Record<string, string> = {};
  list.forEach((error) => {
    byField[error.field] ??= error.message;
  });
  return { list, byField };
}
