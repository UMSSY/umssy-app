export interface SurveyAlertConfigResponse {
  enabled: boolean;
  threshold: number;
  questionIds: string[] | null;
}
