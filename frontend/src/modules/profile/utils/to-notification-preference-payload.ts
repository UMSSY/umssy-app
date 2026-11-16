import type { NotificationChannel } from "@/modules/notifications";
import type { UpdateNotificationPreferencePayload } from "../types/update-notification-preference-payload.types";

export function toNotificationPreferencePayload(
  channel: NotificationChannel,
): UpdateNotificationPreferencePayload {
  return {
    pushEnabled: channel === "push",
    emailEnabled: channel === "email",
    inAppEnabled: channel === "in-app",
  };
}