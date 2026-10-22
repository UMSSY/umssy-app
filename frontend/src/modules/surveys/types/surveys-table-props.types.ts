import type { SurveyStatusChange } from "./survey-status-change.types";
import type { SurveyListItem } from "./survey.types";

export interface SurveysTableProps {
  surveys: SurveyListItem[];
  isLoading: boolean;
  errorMessage?: string;
  searchTerm?: string;
  pendingChange?: SurveyStatusChange;
  onToggleStatus: (change: SurveyStatusChange) => void;
}
