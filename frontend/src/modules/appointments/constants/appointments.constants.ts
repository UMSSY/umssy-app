import type { AppointmentCounterpart } from "../types/appointment-counterpart.types";
import type { AppointmentStatus } from "../types/appointment-status.types";

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
  noTopic: "Tema no especificado",
} as const;

export const APPOINTMENT_ROLE_LABELS: Record<
  AppointmentCounterpart["role"],
  string
> = {
  mentor: "Mentor",
  student: "Titulado",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
};

export const APPOINTMENT_STATUS_CLASSES: Record<AppointmentStatus, string> = {
  CONFIRMED: "text-success",
  CANCELLED: "text-text-secondary",
  COMPLETED: "text-text-secondary",
};

export const APPOINTMENT_CANCELLATION_TEXT = {
  byMe: "Cancelada por ti",
  byMentor: "Cancelada por el mentor",
  byStudent: "Cancelada por el titulado",
  fallback: "Cancelada",
  rebook: "Reservar otro horario",
} as const;

export const APPOINTMENT_DETAIL_TEXT = {
  fallbackTitle: "Detalle de la cita",
  titlePrefix: "Cita con",
  loading: "Cargando el detalle de la cita",
  loadError: "No se pudo cargar el detalle de la cita.",
  dateLabel: "Fecha",
  scheduleLabel: "Horario",
  topicLabel: "Tema",
  requestedAtLabel: "Reservada el",
  cancellationReasonTitle: "Motivo de la cancelación",
  messageTitle: "Mensaje del titulado",
  noMessage: "Sin mensaje",
  documentTitle: "Documento compartido",
  download: "Descargar",
  downloading: "Descargando...",
  downloadError: "No se pudo descargar el documento. Intenta de nuevo.",
  close: "Cerrar",
  mentorProfile: "Ver perfil del mentor",
  photoAlt: "Foto de perfil de",
} as const;

export const JOIN_MEETING_TEXT = {
  join: "Unirse a la reunión",
  unavailable: "No se pudo abrir la reunión. Intenta nuevamente.",
} as const;

export const APPOINTMENT_WEEKDAY_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;
