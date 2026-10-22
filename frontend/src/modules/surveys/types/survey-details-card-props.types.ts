import type { SurveyFormValues, SurveyHeaderField } from "./survey-form.types";

export interface SurveyDetailsCardProps {
  values: SurveyFormValues;
  errors: Partial<Record<SurveyHeaderField, string>>;
  onChange: (field: SurveyHeaderField, value: SurveyFormValues[SurveyHeaderField]) => void;
}
