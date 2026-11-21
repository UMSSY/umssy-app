import type { NotificationCategory } from "../types/notification-category.types";
import { getNotificationCatalogDefinition } from "./get-notification-catalog-definition";

export function getNotificationCategory(typeCode: string): NotificationCategory {
  return getNotificationCatalogDefinition(typeCode).category;
}
