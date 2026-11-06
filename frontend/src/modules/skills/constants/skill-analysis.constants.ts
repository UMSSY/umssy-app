export const SKILL_ANALYSIS_TEXTS = {
  title: "Habilidades detectadas",
  analyze: "Volver a analizar",
  analyzing: "Analizando...",
  loading: "Cargando análisis...",
  pending: "Hay cambios pendientes de analizar.",
  empty: "No se detectaron habilidades del catálogo en tus registros y documentos.",
  failed: "No se pudo completar el análisis. Revisa tus documentos e intenta nuevamente.",
  loadFailed: "No se pudo consultar el análisis. Intenta nuevamente.",
  pendingVerification: "Pendiente de verificación",
  verified: "Verificada",
  rejected: "Algunas fuentes no pudieron analizarse.",
} as const;

export const SKILL_EVIDENCE_LABELS: Record<string, string> = {
  cv: "CV",
  certification: "Certificación",
  "work-experience": "Experiencia laboral",
  education: "Formación académica",
};
