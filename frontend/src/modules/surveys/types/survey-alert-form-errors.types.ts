export interface SurveyAlertFormErrors {
  threshold?: string;
  questions?: string;
}

export interface SurveyAlertFormValues {
  enabled: boolean;
  threshold: string;
  questionIds: string[];
}
