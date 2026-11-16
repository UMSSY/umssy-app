export interface SurveyAlertConfig {
  enabled: boolean;
  threshold: number;
  questionIds: string[] | null;
}
