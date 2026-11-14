export type NotificationResponse = {
  id: string;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
  typeCode: string;
};