import type { SurveyInput, SurveyQuestionInput } from "./survey.types";
import type { SurveyValidationError, SurveyValidationMode } from "./survey-validation.types";

// Pregunta dentro del formulario: igual a la del contrato, más una clave estable para que React
// identifique cada tarjeta al agregar, duplicar o borrar preguntas.
export interface SurveyFormQuestion extends SurveyQuestionInput {
  key: string;
}

export interface SurveyFormValues extends Omit<SurveyInput, "questions"> {
  questions: SurveyFormQuestion[];
}

export type SurveyHeaderField = "title" | "description" | "targetCareer" | "period" | "opensAt" | "closesAt";

export interface SurveyFormState {
  values: SurveyFormValues;
  activeKey: string | null;
  // Los errores se muestran solo después del primer intento de guardar o de publicar.
  attemptedMode: SurveyValidationMode | null;
  isDirty: boolean;
}

export type SurveyFormAction =
  | { type: "setField"; field: SurveyHeaderField; value: SurveyFormValues[SurveyHeaderField] }
  | { type: "setActive"; key: string }
  | { type: "addQuestion" }
  | { type: "duplicateQuestion"; key: string }
  | { type: "removeQuestion"; key: string }
  | { type: "updateQuestion"; key: string; changes: Partial<SurveyQuestionInput> }
  | { type: "addOption"; key: string }
  | { type: "updateOption"; key: string; index: number; text: string }
  | { type: "removeOption"; key: string; index: number }
  | { type: "attempt"; mode: SurveyValidationMode }
  | { type: "markSaved" }
  | { type: "reset"; values: SurveyFormValues };

export interface SurveyFormErrors {
  list: SurveyValidationError[];
  byField: Record<string, string>;
}
