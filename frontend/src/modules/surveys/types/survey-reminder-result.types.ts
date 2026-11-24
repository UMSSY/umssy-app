import type { SurveyReminderPushStatus } from "./survey-reminder-push-status.types";

export interface SurveyReminderResult {
  surveyId: string;
  pendingCount: number;
  emailsDelivered: number;
  emailsFailed: number;
  pushStatus: SurveyReminderPushStatus;
  sentAt: string;
}
