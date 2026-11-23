import type { NotificationChannel } from "../types/notification-channel.types";
import type { NotificationPreferenceResponse } from "../types/notification-preference-response.types";

export function channelToPreferences(channel: NotificationChannel): NotificationPreferenceResponse {
  return {
    pushEnabled: channel === "push",
    emailEnabled: channel === "email",
    inAppEnabled: true,
  };
}