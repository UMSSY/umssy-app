import { DEFAULT_NOTIFICATION_CATALOG_DEFINITION, NOTIFICATION_CATALOG } from "../constants/notification-catalog.constants";
import type { NotificationCatalogDefinition } from "../types/notification-catalog-definition.types";
import { isNotificationType } from "./is-notification-type";

export function getNotificationCatalogDefinition(typeCode: string): NotificationCatalogDefinition {
  return isNotificationType(typeCode) ? NOTIFICATION_CATALOG[typeCode] : DEFAULT_NOTIFICATION_CATALOG_DEFINITION;
}
