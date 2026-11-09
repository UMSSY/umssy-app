export interface SurveyDateFieldProps {
  id: string;
  label: string;
  value: string;
  minDate: Date;
  error?: string;
  onChange: (value: string) => void;
}
