export const SURVEY_STATISTICS_SUMMARY_SKELETONS = 4;
export const SURVEY_STATISTICS_QUESTION_SKELETONS = 2;
export const SURVEY_PDF_FEEDBACK_DURATION_MS = 4000;

export const SURVEY_PERIOD_FILTER_LABEL = "Gestión académica";
export const SURVEY_PERIOD_FILTER_ALL_LABEL = "Todos";

export const SURVEY_STATISTICS_TEXT = {
  pageTitle: "Analíticas de la encuesta",
  loadingDescription: "Obteniendo resultados de la encuesta...",
  noResponses: "Esta encuesta aún no ha recibido respuestas",
  noResponsesHint: "Cuando los titulados completen la encuesta, aquí se graficarán los porcentajes de cada opción.",
  noResponsesInPeriod: (period: string) => `No hay respuestas registradas en la gestión ${period}`,
  noResponsesInPeriodHint: "Las preguntas y sus opciones se muestran en cero. Elige otra gestión para ver otros resultados.",
  exportDisabled: "No hay respuestas para exportar",
} as const;

export const SURVEY_TREND_LABELS = {
  up: "Tendencia al alza",
  down: "Tendencia a la baja",
  neutral: "Tendencia estable",
} as const;
