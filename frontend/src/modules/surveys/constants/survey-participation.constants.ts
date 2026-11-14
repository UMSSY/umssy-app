export const SURVEY_ALERT_THRESHOLD_MIN = 1;
export const SURVEY_ALERT_THRESHOLD_MAX = 50;
export const SURVEY_ALERT_DEFAULT_THRESHOLD = 10;

export const SURVEY_AUDIENCE_MOCK = {
  totalAudience: 120,
  audienceLabel: "Ingeniería de Sistemas · Titulados 2020",
  lastReminderAt: "2026-11-05T14:00:00.000Z",
} as const;

export const SURVEY_PARTICIPATION_TEXT = {
  responseRateLabel: "Tasa de respuesta",
  respondedSummary: (received: number, total: number) => `${received} de ${total} titulados han respondido`,
  audience: (label: string) => `Audiencia: ${label}`,
  sendReminder: (pending: number) => `Enviar recordatorio · ${pending} pendientes`,
  sendingReminder: "Enviando recordatorio...",
  noPending: "Todos los titulados han respondido",
  lastReminder: (date: string) => `Último recordatorio: ${date}`,
  noReminder: "Aún no se envió ningún recordatorio",
  reminderSent: (pending: number) => `Recordatorio enviado a ${pending} titulados pendientes.`,
  reminderError: "No se pudo enviar el recordatorio. Inténtalo de nuevo.",
} as const;

export const SURVEY_ALERTS_TEXT = {
  trigger: "Alertas",
  title: "Alertas de cambios",
  description: "Recibe un aviso cuando una opción de las preguntas que elijas suba o baje mucho frente al semestre anterior.",
  enableLabel: "Activar alertas",
  thresholdLabel: "Umbral de cambio",
  thresholdSuffix: "pp",
  thresholdHint: `puntos porcentuales (entre ${SURVEY_ALERT_THRESHOLD_MIN} y ${SURVEY_ALERT_THRESHOLD_MAX})`,
  questionsLabel: "Preguntas a vigilar",
  selectedCount: (selected: number, total: number) => `${selected} de ${total}`,
  selectAll: "Marcar todas",
  clearAll: "Desmarcar todas",
  noQuestions: "Esta encuesta no tiene preguntas para vigilar.",
  exampleTitle: "Ejemplo.",
  example: "Si en P1 Buscando empleo pasa de 18% a 30%, subió 12 puntos y se enviará un aviso.",
  cancel: "Cancelar",
  save: "Guardar",
  saving: "Guardando...",
  saved: "Configuración de alertas guardada.",
  saveError: "No se pudo guardar la configuración de alertas. Inténtalo de nuevo.",
  thresholdError: `El umbral debe estar entre ${SURVEY_ALERT_THRESHOLD_MIN} y ${SURVEY_ALERT_THRESHOLD_MAX} puntos porcentuales.`,
  questionsError: "Selecciona al menos una pregunta para vigilar.",
} as const;
