export type PushNotificationPayload = {
  title: string;
  body: string;
  icon: string;
  actionUrl: string;
  groupKey?: string;
  notificationId?: string;
};
