import type { NotificationChannel } from "../types/notification-channel.types";
import type { NotificationPreferenceResponse } from "../types/notification-preference-response.types";

// La campana de la app siempre sigue activa: solo cambia el canal extra.
export function channelToPreferences(channel: NotificationChannel): NotificationPreferenceResponse {
  return {
    pushEnabled: channel === "push",
    emailEnabled: channel === "email",
    inAppEnabled: true,
  };
}