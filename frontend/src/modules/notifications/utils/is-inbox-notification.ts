import { getNotificationCategory } from "./get-notification-category";

export function isInboxNotification(typeCode: string): boolean {
  return getNotificationCategory(typeCode) !== "CHAT";
}
