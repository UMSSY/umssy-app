export interface SurveyReminderResult {
  sent: boolean;
  pendingResponses: number;
  message: string;
  sentAt: string;
}
