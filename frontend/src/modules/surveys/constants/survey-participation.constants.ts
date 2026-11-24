import type { SurveyResponseRateLevel } from "../types/survey-response-rate-level.types";

export const SURVEY_ALERT_THRESHOLD_MIN = 1;
export const SURVEY_ALERT_THRESHOLD_MAX = 50;
export const SURVEY_ALERT_THRESHOLD_MAX_LENGTH = String(SURVEY_ALERT_THRESHOLD_MAX).length;

export const SURVEY_RESPONSE_RATE_LEVEL_THRESHOLDS = {
  lowMax: 35,
  mediumMax: 65,
} as const;

export const SURVEY_RESPONSE_RATE_LEVEL_LABELS = {
  low: "Participación baja",
  medium: "Participación media",
  expected: "Participación esperada",
} as const satisfies Record<SurveyResponseRateLevel, string>;

const pluralize = (count: number, singular: string, plural: string) => (count === 1 ? singular : plural);

export const SURVEY_PARTICIPATION_TEXT = {
  responseRateLabel: "Tasa de respuesta",
  respondedSummary: (received: number, total: number) => `${received} de ${total} titulados han respondido`,
  audience: (label: string) => `Audiencia: ${label}`,
  sendReminder: (pending: number) =>
    `Enviar recordatorio (${pending} ${pluralize(pending, "pendiente", "pendientes")})`,
  sendingReminder: "Enviando recordatorio...",
  noPending: "Todos los titulados han respondido",
  lastReminder: (date: string) => `Último recordatorio: ${date}`,
  noReminder: "Aún no se envió ningún recordatorio",
  confirmTitle: "Enviar recordatorio",
  confirmDescription: (pending: number, audience: string) =>
    `Se enviará un correo y una notificación push a ${pending} ${pluralize(pending, "titulado", "titulados")} de la audiencia ${audience} que aún no ${pluralize(pending, "respondió", "respondieron")}. Quienes ya respondieron no recibirán el recordatorio.`,
  confirmAction: "Confirmar envío",
  cancel: "Cancelar",
  reminderSent: (delivered: number) =>
    `Se ${pluralize(delivered, "entregó", "entregaron")} ${delivered} ${pluralize(delivered, "recordatorio", "recordatorios")}.`,
  reminderPartial: (failed: number) => ` No se pudo entregar a ${failed} ${pluralize(failed, "titulado", "titulados")}.`,
  reminderError: "No se pudo enviar el recordatorio. Inténtalo de nuevo.",
  loadError: "No se pudo cargar la participación de la encuesta.",
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
  discardDescription: "Los cambios en la configuración de alertas no se guardarán.",
  save: "Guardar",
  saving: "Guardando...",
  saved: "Configuración de alertas guardada.",
  saveError: "No se pudo guardar la configuración de alertas. Inténtalo de nuevo.",
  loadError: "No se pudo cargar la configuración de alertas. Inténtalo de nuevo más tarde.",
  thresholdError: `El umbral debe estar entre ${SURVEY_ALERT_THRESHOLD_MIN} y ${SURVEY_ALERT_THRESHOLD_MAX} puntos porcentuales.`,
  thresholdRequired: "El umbral de cambio es obligatorio.",
  thresholdMin: `El umbral mínimo es ${SURVEY_ALERT_THRESHOLD_MIN} punto porcentual.`,
  thresholdMax: `El umbral máximo es ${SURVEY_ALERT_THRESHOLD_MAX} puntos porcentuales.`,
  questionsError: "Selecciona al menos una pregunta para vigilar.",
} as const;
