import type { SurveyFormValues } from "./survey-form.types";

export interface SurveyFormProps {
  // null al crear una encuesta nueva; el id del borrador al editarlo.
  surveyId: string | null;
  initialValues: SurveyFormValues;
  // true cuando se retoma un avance guardado que todavía no se guardó en el servidor.
  startsDirty?: boolean;
}
