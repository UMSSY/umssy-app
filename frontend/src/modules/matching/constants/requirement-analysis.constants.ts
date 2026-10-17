import type { BreadcrumbEntry } from "@/shared/types/breadcrumb-entry.types";

export const REQUIREMENT_TERMS_ENDPOINT = "/matching/requirements/terms";

export const MAX_REQUIREMENT_TEXT_LENGTH = 5000;

export const REQUIREMENT_EXAMPLE_TEXT =
  "Egresado de la Universidad Mayor de San Simón, con experiencia en Python, Node.js y Scrum";

export const REQUIREMENT_ANALYSIS_BREADCRUMB: BreadcrumbEntry[] = [
  { label: "UMSSY", href: "/" },
  { label: "Empleos" },
  { label: "Analizar requisitos" },
];

export const REQUIREMENT_ANALYSIS_MESSAGES = {
  pageTitle: "Analizar requisitos de una oferta",
  pageDescription:
    "Pega los requisitos de una oferta y revisa qué términos, habilidades e instituciones reconoce el sistema.",
  textLabel: "Requisitos de la oferta",
  textPlaceholder: "Pega aquí los requisitos de la oferta",
  useExample: "Usar texto de ejemplo",
  analyze: "Analizar",
  analyzing: "Analizando...",
  limitExceeded: `El texto no puede superar los ${MAX_REQUIREMENT_TEXT_LENGTH} caracteres`,
  resultTitle: "Resultado del análisis",
  noSkills: "No se detectaron habilidades conocidas en el texto.",
  institutionsTitle: "Instituciones detectadas",
  noInstitutions: "No se detectaron instituciones.",
  tokensTitle: "Términos",
  compoundTitle: "Términos compuestos",
  emptyTitle: "No encontramos términos reconocibles",
  emptyText: "Prueba con un texto más descriptivo de los requisitos de la oferta.",
  error: "No pudimos analizar el texto. Intenta nuevamente.",
  retry: "Reintentar",
} as const;
