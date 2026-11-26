export type NotificationsSyncMessage =
  | { type: "MARK_READ"; notificationId: string; readAt: string }
  | { type: "MARK_ALL_READ"; readAt: string };
