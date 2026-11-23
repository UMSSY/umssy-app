import type { NotificationChannel } from "../types/notification-channel.types";
import type { NotificationPreferenceResponse } from "../types/notification-preference-response.types";

export function preferencesToChannel(preferences: NotificationPreferenceResponse): NotificationChannel {
  if (preferences.pushEnabled) return "push";
  if (preferences.emailEnabled) return "email";
  return "in-app";
}