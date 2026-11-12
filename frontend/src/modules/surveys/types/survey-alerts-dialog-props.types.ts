import type { SurveyAlertConfig, SurveyAlertConfigPayload } from "./survey-alert-config.types";
import type { SurveyAlertQuestion } from "./survey-alert-question.types";

export interface SurveyAlertsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: SurveyAlertQuestion[];
  config?: SurveyAlertConfig;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (payload: SurveyAlertConfigPayload) => Promise<void>;
}

export interface SurveyAlertsFormProps {
  questions: SurveyAlertQuestion[];
  config: SurveyAlertConfig;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (payload: SurveyAlertConfigPayload) => Promise<void>;
}
