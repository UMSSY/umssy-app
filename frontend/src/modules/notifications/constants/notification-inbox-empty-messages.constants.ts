import type { NotificationInboxFilter } from "../types/notification-inbox-filter.types";

export interface NotificationInboxEmptyMessage {
  title: string;
  description: string;
}

export const NOTIFICATION_INBOX_EMPTY_MESSAGES: Record<
  NotificationInboxFilter,
  NotificationInboxEmptyMessage
> = {
  ALL: {
    title: "No tienes notificaciones",
    description:
      "Cuando recibas nuevos avisos sobre encuestas, recordatorios o actividad de tu cuenta, aparecerán aquí.",
  },
  SURVEYS: {
    title: "No tienes notificaciones",
    description:
      "Cuando recibas nuevos avisos sobre encuestas, aparecerán aquí.",
  },
  REMINDERS: {
    title: "No tienes notificaciones",
    description:
      "Cuando recibas nuevos avisos sobre recordatorios, aparecerán aquí.",
  },
  SYSTEM: {
    title: "No tienes notificaciones",
    description:
      "Cuando recibas nuevos avisos del sistema, aparecerán aquí.",
  },
};
