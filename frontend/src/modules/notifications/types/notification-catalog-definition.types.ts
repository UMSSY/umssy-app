import type { LucideIcon } from "lucide-react";
import type { NotificationCategory } from "./notification-category.types";

export interface NotificationCatalogDefinition {
  category: NotificationCategory;
  icon: LucideIcon;
  fallbackPath: string;
}
