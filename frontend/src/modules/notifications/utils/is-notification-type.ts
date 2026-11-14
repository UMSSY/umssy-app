import { NOTIFICATION_CATALOG } from "../constants/notification-catalog.constants";
import type { NotificationType } from "../types/notification-type.types";

export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === "string" && Object.hasOwn(NOTIFICATION_CATALOG, value);
}
