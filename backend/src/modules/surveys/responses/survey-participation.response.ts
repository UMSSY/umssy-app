export interface SurveyParticipationResponse {
  surveyId: string;
  respondedCount: number;
  eligibleCount: number;
  pendingCount: number;
  responseRate: number;
  audienceLabel: string;
  lastReminderSentAt: string | null;
  canSendReminder: boolean;
}
