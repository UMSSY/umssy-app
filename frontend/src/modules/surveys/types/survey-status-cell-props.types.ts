import type { SurveyStatusChange } from "./survey-status-change.types";
import type { SurveyListItem, SurveyStatus } from "./survey.types";

export interface SurveyStatusCellProps {
  survey: SurveyListItem;
  pendingStatus?: SurveyStatus;
  onToggle: (change: SurveyStatusChange) => void;
}
