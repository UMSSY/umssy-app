export interface SurveyPeriodFilterProps {
  periods: string[];
  value?: string;
  onChange: (period?: string) => void;
}
