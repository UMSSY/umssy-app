import type { SurveyAlertConfigPayload } from "./survey-alert-config-payload.types";
import type { SurveyAlertConfig } from "./survey-alert-config.types";
import type { SurveyAlertQuestion } from "./survey-alert-question.types";

export interface SurveyAlertsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: SurveyAlertQuestion[];
  config?: SurveyAlertConfig;
  isLoading: boolean;
  hasError: boolean;
  isSaving: boolean;
  onSave: (payload: SurveyAlertConfigPayload) => Promise<void>;
}
