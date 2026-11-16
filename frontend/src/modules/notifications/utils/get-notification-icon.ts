import type { LucideIcon } from "lucide-react";
import { getNotificationCatalogDefinition } from "./get-notification-catalog-definition";

export function getNotificationIcon(typeCode: string): LucideIcon {
  return getNotificationCatalogDefinition(typeCode).icon;
}
