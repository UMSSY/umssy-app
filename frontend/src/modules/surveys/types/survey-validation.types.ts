export interface SurveyValidationError {
  path: string;
  label: string;
  message: string;
  summary: string;
}

export type SurveyErrorMap = Readonly<Record<string, string>>;
