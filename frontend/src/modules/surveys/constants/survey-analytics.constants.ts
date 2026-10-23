// Respuestas mínimas de una pregunta para describir una tendencia (CA 21 de la HU4).
export const SURVEY_TREND_MIN_RESPONSES = 5;

export const SURVEY_ANALYTICS_MESSAGES = {
  loadError: "No se pudieron cargar las estadísticas de la encuesta.",
  noStatistics: "Esta encuesta todavía no tiene estadísticas. Estarán disponibles cuando se publique.",
  noResponses: "Esta encuesta todavía no tiene respuestas registradas. Los resultados aparecerán aquí cuando los titulados respondan.",
  pickSurvey: "Elige una encuesta publicada desde el historial para ver sus métricas y los resultados de cada pregunta.",
} as const;
