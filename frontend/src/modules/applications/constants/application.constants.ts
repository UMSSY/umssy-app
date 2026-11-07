import type { ApplicationStatus } from "../types/application.types";
import type { ApplicationSortKey, ApplicationStatusFilter } from "../types/application-list.types";

export const APPLICATIONS_ENDPOINT = "/applications/me";

export function getWithdrawApplicationEndpoint(applicationId: string): string {
  return `/applications/${applicationId}/withdraw`;
}

export const APPLICATION_QUERY_KEYS = {
  mine: ["applications", "mine"] as const,
};

export const VACANCIES_ROUTE = "/vacancies";

export const WITHDRAWABLE_STATUSES: readonly ApplicationStatus[] = ["En revisión", "Entrevista"];

export const APPLICATION_MESSAGES = {
  pageTitle: "Mis postulaciones",
  emptyTitle: "Todavía no te postulaste a ninguna vacante",
  exploreVacancies: "Explorar vacantes",
  loadError: "No pudimos cargar tus postulaciones. Intenta nuevamente.",
  retry: "Reintentar",
  withdraw: "Retirar",
  withdrawing: "Retirando…",
  withdrawError: "No pudimos retirar la postulación. Intenta nuevamente.",
  notAvailable: "No disponible",
  vacancy: "Vacante",
  company: "Empresa",
  affinity: "Afinidad",
  status: "Estado",
  actions: "Acciones",
  statusTabsLabel: "Filtrar postulaciones por estado",
  allStatuses: "Todas",
  noApplicationsInStatus: "No tienes postulaciones en este estado.",
  confirmWithdrawTitle: "¿Retirar tu postulación?",
  confirmWithdrawDescription:
    "Dejarás de participar en el proceso de esta vacante. Esta acción no se puede deshacer desde Mis postulaciones.",
  cancel: "Cancelar",
  confirmWithdraw: "Sí, retirar",
} as const;

export const APPLICATION_STATUS_TABS: readonly { value: ApplicationStatusFilter; label: string }[] = [
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
];
