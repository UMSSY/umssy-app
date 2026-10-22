export type SurveyNotificationStatus = "pending" | "expired" | "answered";

export interface SurveyNotification {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  status: SurveyNotificationStatus;
}

export interface SurveyStatusStyle {
  iconBox: string;
  badge: string;
}
