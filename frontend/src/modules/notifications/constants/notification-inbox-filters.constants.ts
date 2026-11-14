import type { NotificationInboxFilter } from "../types/notification-inbox-filter.types";

export const NOTIFICATION_INBOX_FILTERS: readonly NotificationInboxFilter[] = ["ALL", "SURVEYS", "REMINDERS", "SYSTEM"];

export const NOTIFICATION_INBOX_FILTER_LABELS: Record<NotificationInboxFilter, string> = {
  ALL: "Todas",
  SURVEYS: "Notificaciones de Encuestas",
  REMINDERS: "Recordatorios",
  SYSTEM: "Sistema",
};
