import type { ApplicationStatus } from "../types/application.types";

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
} as const;
