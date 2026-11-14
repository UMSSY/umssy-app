export interface SurveyParticipation {
  responseRate: number;
  responsesReceived: number;
  totalAudience: number;
  pendingResponses: number;
  audienceLabel: string;
  lastReminderAt: string | null;
}
