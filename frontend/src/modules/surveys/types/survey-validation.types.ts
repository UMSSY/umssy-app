// "draft" valida lo mínimo para guardar un borrador; "publish" exige la encuesta completa.
export type SurveyValidationMode = "draft" | "publish";

export interface SurveyValidationError {
  // Ruta del campo con error, por ejemplo "closesAt" o "questions.3.options".
  field: string;
  // Texto que se muestra debajo del campo.
  message: string;
  // Texto que se lista en el banner de errores.
  summary: string;
}
