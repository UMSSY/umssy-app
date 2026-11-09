import type { BreadcrumbEntry } from "@/shared/types/breadcrumb-entry.types";

export const REGISTERED_USERS_PAGE_SIZE = 10;
export const REJECTED_USERS_PAGE_SIZE = 10;
export const REPORT_HISTORY_PAGE_SIZE = 10;

export const SEARCH_DEBOUNCE_MS = 300;
export const EMAIL_SEARCH_LABEL = "Buscar por correo electrónico";

export const EMAIL_SEARCH_NO_RESULTS_MESSAGE = "No se encontró ningún usuario con el correo";

export const SLOW_REQUEST_THRESHOLD_MS = 10_000;
export const SLOW_REQUEST_MESSAGE = "Error 408: La solicitud está tardando demasiado";
export const CONNECTION_ERROR_MESSAGE = "Sin conexión con el servidor. Vuelve a intentarlo en unos minutos";

export const REPORT_ALERT_DURATION_MS = 7_000;

export const REGISTERED_USERS_CSV_FALLBACK_NAME = "usuarios-registrados.csv";
export const REJECTED_USERS_CSV_FALLBACK_NAME = "usuarios-rechazados.csv";

export const REGISTERED_USERS_BREADCRUMB: BreadcrumbEntry[] = [
  { label: "Inicio", href: "/backoffice" },
  { label: "Reportes Analíticos" },
  { label: "Reporte de usuarios registrados" },
];

export const REJECTED_USERS_BREADCRUMB: BreadcrumbEntry[] = [
  { label: "Inicio", href: "/backoffice" },
  { label: "Reportes Analíticos" },
  { label: "Reporte de usuarios registrados rechazados" },
];

export const REPORT_HISTORY_BREADCRUMB: BreadcrumbEntry[] = [
  { label: "Inicio", href: "/backoffice" },
  { label: "Reportes Analíticos" },
  { label: "Historial de reportes generados" },
];
