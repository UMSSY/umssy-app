import { Minus, TrendingDown, TrendingUp } from "lucide-react";

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

export const SURVEY_TREND_ICONS = { up: TrendingUp, down: TrendingDown, neutral: Minus } as const;

export const SURVEY_TREND_ICON_CLASSES = {
  up: "text-accent",
  down: "text-danger",
  neutral: "text-text-secondary",
} as const;
