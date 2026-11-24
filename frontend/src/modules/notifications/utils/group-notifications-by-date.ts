import type { NotificationResponse } from "../types/notification-response.types";

export type NotificationDateGroupKey = "TODAY" | "YESTERDAY" | "OLDER";

export interface NotificationDateGroup {
  key: NotificationDateGroupKey;
  label: string;
  items: NotificationResponse[];
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function groupNotificationsByDate(
  notifications: readonly NotificationResponse[],
  now: Date = new Date(),
): NotificationDateGroup[] {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const todayItems: NotificationResponse[] = [];
  const yesterdayItems: NotificationResponse[] = [];
  const olderItems: NotificationResponse[] = [];

  for (const item of notifications) {
    const created = new Date(item.createdAt);
    if (!Number.isNaN(created.getTime()) && isSameCalendarDay(created, now)) {
      todayItems.push(item);
    } else if (!Number.isNaN(created.getTime()) && isSameCalendarDay(created, yesterday)) {
      yesterdayItems.push(item);
    } else {
      olderItems.push(item);
    }
  }

  const groups: NotificationDateGroup[] = [];
  if (todayItems.length > 0) {
    groups.push({ key: "TODAY", label: "HOY", items: todayItems });
  }
  if (yesterdayItems.length > 0) {
    groups.push({ key: "YESTERDAY", label: "AYER", items: yesterdayItems });
  }
  if (olderItems.length > 0) {
    groups.push({ key: "OLDER", label: "ANTERIORES", items: olderItems });
  }

  return groups;
}