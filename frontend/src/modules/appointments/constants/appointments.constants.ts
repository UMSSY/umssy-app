import type { AppointmentStatus } from "../types/appointment-status.types";

export const APPOINTMENTS_EYEBROW = "Mentorías";

export const APPOINTMENTS_TEXT = {
  title: "Mis citas",
  tabsLabel: "Listado de citas",
  upcoming: "Próximas",
  past: "Pasadas",
  emptyState: "No tienes citas próximas",
  emptyPast: "No tienes citas pasadas",
  loadError: "No se pudieron cargar tus citas.",
  loading: "Cargando citas",
  searchMentors: "Buscar mentores",
  topicLabel: "Tema:",
  noTopic: "Tema no especificado",
} as const;

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
};
