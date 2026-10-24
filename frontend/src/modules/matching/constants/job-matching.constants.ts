import type { JobFeedFilters } from "../types/job-feed-filters.types";
import type { BreadcrumbEntry } from "@/shared/types/breadcrumb-entry.types";

export const RECOMMENDED_JOBS_ENDPOINT = "/job-offers/recommendations";
export function getJobMatchEndpoint(jobOfferId: string): string {
  return `/job-offers/${jobOfferId}/match`;
}

export const JOBS_ROUTE = "/vacancies/recommended";
export const PROFILE_SKILLS_ROUTE = "/profile/trajectory/skills";

export const JOB_MATCHING_QUERY_KEYS = {
  recommendations: ["job-matching", "recommendations"] as const,
  match: (jobOfferId: string) => ["job-matching", "match", jobOfferId] as const,
};

export const RECOMMENDED_JOBS_BREADCRUMB: BreadcrumbEntry[] = [
  { label: "UMSSY", href: "/dashboard" },
  { label: "Empleos" },
  { label: "Vacantes" },
];

export const JOB_DETAIL_BREADCRUMB: BreadcrumbEntry[] = [
  { label: "UMSSY", href: "/dashboard" },
  { label: "Empleos" },
  { label: "Vacantes", href: JOBS_ROUTE },
  { label: "Ver vacante" },
];

export const JOB_MATCHING_MESSAGES = {
  affinityCaption: "de afinidad",
  pageTitle: "Vacantes para ti",
  pageDescription: "Encuentra ofertas según las habilidades, la carrera y la experiencia de tu perfil.",
  scoreInfoTitle: "¿Qué es la afinidad?",
  scoreInfoText:
    "Comparamos tus habilidades, tu carrera y tu experiencia con lo que pide cada vacante; es una guía para priorizar, no una garantía de contratación.",
  matchedLabel: "Coincide contigo",
  viewJob: "Ver vacante",
  viewLocation: "Ver ubicación",
  back: "Volver",
  requirementsTitle: "Requisitos vs. tu perfil",
  descriptionTitle: "Descripción",
  scoreCaption: "de afinidad con tu perfil",
  noPendingRequirements: "Para esta oportunidad no tienes habilidades ni requisitos pendientes",
  loadError: "No pudimos cargar la información. Intenta nuevamente.",
  retry: "Reintentar",
  notFound: "Esta vacante ya no está disponible.",
  incompleteProfileTitle: "Aún no podemos calcular tu compatibilidad",
  incompleteProfileText:
    "No encontramos habilidades en tu perfil todavía. Complétalo para ver qué vacantes coinciden más contigo.",
  incompleteProfileAction: "Completar mi perfil",
  noMatchesTitle: "Por ahora no hay vacantes que coincidan con tu perfil",
  noMatchesText:
    "Cuando se publiquen ofertas que coincidan con tus habilidades, aparecerán aquí.",
  noMatchesAction: "Revisar mi perfil",
} as const;

export const HIGH_AFFINITY_THRESHOLD = 70;

export const EMPTY_JOB_FEED_FILTERS: JobFeedFilters = {
  search: "",
  modality: null,
  onlyHighAffinity: false,
};

export const JOB_FEED_MODALITIES = ["Presencial", "Remoto", "Híbrido"] as const;

export const JOB_FEED_MESSAGES = {
  listTitle: "Vacantes recomendadas para ti",
  orderedByAffinity: "ordenadas de mayor a menor afinidad",
  searchLabel: "Buscar vacante o empresa",
  modalityLabel: "Modalidad",
  allModalities: "Modalidad: Todas",
  onlyHighAffinity: "Solo alta afinidad",
  clear: "Limpiar",
  noResultsTitle: "Ninguna vacante coincide con tus filtros",
  noResultsText: "Prueba con otra búsqueda o limpia los filtros para ver todas tus vacantes.",
} as const;
