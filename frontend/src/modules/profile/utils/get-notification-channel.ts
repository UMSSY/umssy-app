import type { NotificationChannel, NotificationPreferenceResponse } from "@/modules/notifications";

export function getNotificationChannel(
  preferences: NotificationPreferenceResponse | undefined,
): NotificationChannel {
  if (!preferences) return "email";
  if (preferences.pushEnabled) return "push";
  if (preferences.emailEnabled) return "email";
  return "in-app";
}