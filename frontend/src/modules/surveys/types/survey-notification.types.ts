export type SurveyNotificationStatus = "pending" | "expired" | "answered";

export interface SurveyNotification {
  id: string;
  title: string;
  publishedAt: string;
  status: SurveyNotificationStatus;
}
