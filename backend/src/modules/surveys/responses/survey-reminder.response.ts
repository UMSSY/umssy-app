import type { NotifyResult } from '../../notifications/types/notify-result.type.js';

export interface SurveyReminderResponse {
  surveyId: string;
  pendingCount: number;
  emailsDelivered: number;
  emailsFailed: number;
  pushStatus: NotifyResult['pushStatus'];
  sentAt: string;
}
