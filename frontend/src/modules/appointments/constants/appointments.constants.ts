import type { AppointmentCounterpart } from "../types/appointment-counterpart.types";
import type { AppointmentStatus } from "../types/appointment-status.types";

export const NOT_FOUND_STATUS = 404;

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
  CONFIRMED: "border-success/30 bg-success/10 text-success",
  CANCELLED: "text-text-secondary",
  COMPLETED: "text-text-secondary",
};

export const APPOINTMENT_DETAIL_TEXT = {
  fallbackTitle: "Detalle de la cita",
  titlePrefix: "Cita con",
  loading: "Cargando el detalle de la cita",
  loadError: "No se pudo cargar el detalle de la cita.",
  dateLabel: "Fecha",
  scheduleLabel: "Horario",
  topicLabel: "Tema",
  requestedAtLabel: "Reservada el",
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

export const APPOINTMENT_WEEKDAY_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

export const APPOINTMENT_MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export const APPOINTMENT_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPG",
};

export const APPOINTMENT_DOCUMENT_FALLBACK_TYPE_LABEL = "DOC";
