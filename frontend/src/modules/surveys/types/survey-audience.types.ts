export interface SurveyAudience {
  surveyId: string;
  totalAudience: number;
  audienceLabel: string;
  lastReminderAt: string | null;
}
