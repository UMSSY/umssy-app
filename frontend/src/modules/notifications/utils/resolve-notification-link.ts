import type { NotificationResponse } from "../types/notification-response.types";
import { getNotificationCatalogDefinition } from "./get-notification-catalog-definition";
import { isInternalNotificationLink } from "./is-internal-notification-link";

export function resolveNotificationLink(notification: Pick<NotificationResponse, "typeCode" | "link">): string {
  return isInternalNotificationLink(notification.link)
    ? notification.link
    : getNotificationCatalogDefinition(notification.typeCode).fallbackPath;
}
