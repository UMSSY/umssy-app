import type { SurveyAlertConfigPayload } from "./survey-alert-config-payload.types";
import type { SurveyAlertConfig } from "./survey-alert-config.types";
import type { SurveyAlertQuestion } from "./survey-alert-question.types";

export interface SurveyAlertsFormProps {
  questions: SurveyAlertQuestion[];
  config: SurveyAlertConfig;
  isSaving: boolean;
  onCancel: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onSave: (payload: SurveyAlertConfigPayload) => Promise<void>;
}
