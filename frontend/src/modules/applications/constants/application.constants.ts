import type { ApplicationStatus } from "../types/application.types";
import type { ApplicationSortKey } from "../types/application-sort-key.types";

export function getWithdrawApplicationEndpoint(applicationId: string): string {
  return `/applications/${applicationId}/withdraw`;
}

export function getReactivateApplicationEndpoint(applicationId: string): string {
  return `/applications/${applicationId}/reactivate`;
}

export function getApplicationContactEndpoint(applicationId: string): string {
  return `/applications/${applicationId}/contact`;
}

export const MY_APPLICATIONS_ROUTE = "/vacancies/my-applications";

export function getApplicationVacancyPath(jobOfferId: string): string {
  return `/vacancies/${jobOfferId}`;
}

export function getApplicationChatPath(contactId: string, applicationId: string): string {
  const params = new URLSearchParams({
    contactId,
    contextType: "POSTULACION",
    contextId: applicationId,
  });
  return `/chat?${params.toString()}`;
}

export const APPLICATION_QUERY_KEYS = {
  mine: ["applications", "mine"] as const,
};

export const WITHDRAWN_STATUS: ApplicationStatus = "Retirada";

export const APPLICATION_MESSAGES = {
  pageTitle: "Mis postulaciones",
  emptyTitle: "Todavía no te postulaste a ninguna vacante",
  exploreVacancies: "Explorar vacantes",
  loadError: "No pudimos cargar tus postulaciones. Intenta nuevamente.",
  retry: "Reintentar",
  withdraw: "Retirar",
  withdrawing: "Retirando…",
  withdrawError: "No pudimos retirar la postulación. Intenta nuevamente.",
  viewVacancy: "Ver vacante",
  vacancyClosed: "Vacante cerrada",
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
  date: "Fecha",
  actions: "Acciones",
  noActiveApplications: "No tienes postulaciones activas.",
  noWithdrawnApplications: "No tienes postulaciones retiradas.",
  withdrawnApplications: "Postulaciones retiradas",
  confirmWithdrawTitle: "¿Retirar tu postulación?",
  confirmWithdrawDescription:
    "Dejarás de participar en el proceso de esta vacante. Esta acción no se puede deshacer desde Mis postulaciones.",
  cancel: "Cancelar",
  confirmWithdraw: "Sí, retirar",
} as const;

export const APPLICATION_SORT_COLUMNS: readonly { key: ApplicationSortKey; label: string }[] = [
  { key: "vacancy", label: APPLICATION_MESSAGES.vacancy },
  { key: "company", label: APPLICATION_MESSAGES.company },
  { key: "affinity", label: APPLICATION_MESSAGES.affinity },
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
] as const;
