export interface SurveyAlertConfig {
  enabled: boolean;
  threshold: number;
  questionIds: string[] | null;
}

export interface SurveyAlertConfigPayload {
  enabled: boolean;
  threshold: number;
  questionIds: string[];
}
