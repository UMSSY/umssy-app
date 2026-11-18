import type { SurveyAlertConfig } from "./survey-alert-config.types";

export interface SurveyAlertConfigSaved extends SurveyAlertConfig {
  saved: boolean;
}
