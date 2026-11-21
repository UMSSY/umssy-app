import type { SurveyNotificationStatus } from "./survey-notification-status.types";
export interface SurveyNotification {
  id: string;
  title: string;
  publishedAt: string;
  status: SurveyNotificationStatus;
}
export type { SurveyNotificationStatus } from "./survey-notification-status.types";
