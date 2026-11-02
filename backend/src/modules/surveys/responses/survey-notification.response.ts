export interface SurveyNotificationResponse {
  id: string;
  title: string;
  publishedAt: string;
  status: 'pending' | 'expired' | 'answered';
}
