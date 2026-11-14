import type { NotificationCategory } from "./notification-category.types";

export type NotificationInboxFilter = "ALL" | Exclude<NotificationCategory, "CHAT">;
