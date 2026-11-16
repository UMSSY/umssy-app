import type { ApplicationStatus } from "../types/application.types";
import type { ApplicationSortKey } from "../types/application-sort-key.types";
import type { ApplicationStatusFilter } from "../types/application-status-filter.types";

export function getWithdrawApplicationEndpoint(applicationId: string): string {
  return `/applications/${applicationId}/withdraw`;
}

export function getReactivateApplicationEndpoint(applicationId: string): string {
  return `/applications/${applicationId}/reactivate`;
}

export function getApplicationContactEndpoint(applicationId: string): string {
  return `/applications/${applicationId}/contact`;
}

export function getApplicationChatPath(applicationId: string): string {
  return `/chat?applicationId=${encodeURIComponent(applicationId)}`;
}

export const APPLICATION_QUERY_KEYS = {
  mine: ["applications", "mine"] as const,
};

export const WITHDRAWABLE_STATUSES: readonly ApplicationStatus[] = ["En revisión", "Entrevista"];

export const CONTACTABLE_STATUSES: readonly ApplicationStatus[] = ["En revisión", "Entrevista", "Aceptada"];

export const WITHDRAWN_STATUS: ApplicationStatus = "Retirada";

const IN_PROGRESS_BADGE_CLASS = "bg-availability text-availability-foreground";

const CLOSED_BADGE_CLASS = "bg-brand-soft text-danger";

export const APPLICATION_STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
  "En revisión": IN_PROGRESS_BADGE_CLASS,
  Entrevista: IN_PROGRESS_BADGE_CLASS,
  Aceptada: "bg-success-soft text-success-soft-foreground",
  "No seleccionado": CLOSED_BADGE_CLASS,
  Retirada: CLOSED_BADGE_CLASS,
};

export const APPLICATION_MESSAGES = {
  pageTitle: "Mis postulaciones",
  emptyTitle: "Todavía no te postulaste a ninguna vacante",
  exploreVacancies: "Explorar vacantes",
  loadError: "No pudimos cargar tus postulaciones. Intenta nuevamente.",
  retry: "Reintentar",
  withdraw: "Retirar",
  withdrawing: "Retirando…",
  withdrawError: "No pudimos retirar la postulación. Intenta nuevamente.",
  contact: "Contactar",
  contacting: "Abriendo chat…",
  contactRestricted: "Esta postulación ya no permite la comunicación directa con el reclutador.",
  offline: "No hay conexión a internet. Revisa tu conexión e intenta nuevamente.",
  contactError: "No pudimos abrir la conversación con el reclutador. Intenta nuevamente.",
  noRecruiters: "La empresa todavía no tiene reclutadores disponibles para conversar.",
  vacancy: "Vacante",
  vacancyAndCompany: "Vacante y empresa",
  company: "Empresa",
  affinity: "Afinidad",
  status: "Estado",
  date: "Fecha",
  actions: "Acciones",
  show: "Mostrar:",
  allStatuses: "Todos",
  noApplicationsInStatus: "No tienes postulaciones en este estado.",
  noActiveApplications: "No tienes postulaciones activas.",
  withdrawnApplications: "Postulaciones retiradas",
  confirmWithdrawTitle: "¿Retirar tu postulación?",
  confirmWithdrawDescription:
    "Dejarás de participar en el proceso de esta vacante. Esta acción no se puede deshacer desde Mis postulaciones.",
  cancel: "Cancelar",
  confirmWithdraw: "Sí, retirar",
} as const;

export const APPLICATION_STATUS_OPTIONS: readonly { value: ApplicationStatusFilter; label: string }[] = [
  { value: "all", label: APPLICATION_MESSAGES.allStatuses },
  { value: "En revisión", label: "En revisión" },
  { value: "Entrevista", label: "Entrevista" },
  { value: "Aceptada", label: "Aceptada" },
  { value: "No seleccionado", label: "No seleccionado" },
  { value: "Retirada", label: "Retirada" },
];

export const APPLICATION_SORT_COLUMNS: readonly { key: ApplicationSortKey; label: string }[] = [
  { key: "vacancy", label: APPLICATION_MESSAGES.vacancy },
  { key: "company", label: APPLICATION_MESSAGES.company },
  { key: "affinity", label: APPLICATION_MESSAGES.affinity },
  { key: "status", label: APPLICATION_MESSAGES.status },
  { key: "date", label: APPLICATION_MESSAGES.date },
];

export const APPLICATION_SORT_OPTIONS = [
  { value: "date:desc", key: "date", direction: "desc", label: "Fecha (más reciente)" },
  { value: "date:asc", key: "date", direction: "asc", label: "Fecha (más antigua)" },
  { value: "vacancy:asc", key: "vacancy", direction: "asc", label: "Vacante (A-Z)" },
  { value: "vacancy:desc", key: "vacancy", direction: "desc", label: "Vacante (Z-A)" },
  { value: "company:asc", key: "company", direction: "asc", label: "Empresa (A-Z)" },
  { value: "company:desc", key: "company", direction: "desc", label: "Empresa (Z-A)" },
  { value: "affinity:desc", key: "affinity", direction: "desc", label: "Afinidad (mayor a menor)" },
  { value: "affinity:asc", key: "affinity", direction: "asc", label: "Afinidad (menor a mayor)" },
  { value: "status:asc", key: "status", direction: "asc", label: "Estado (ascendente)" },
  { value: "status:desc", key: "status", direction: "desc", label: "Estado (descendente)" },
] as const;
