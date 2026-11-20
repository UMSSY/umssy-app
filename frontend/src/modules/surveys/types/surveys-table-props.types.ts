import type { SurveySummary } from "./survey-summary.types";

export interface SurveysTableProps {
  surveys: SurveySummary[];
  isLoading: boolean;
  hasError: boolean;
  emptyMessage?: string;
}
