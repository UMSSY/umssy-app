import { readFileSync } from 'node:fs';
import type { NotificationMailContent } from '../../notifications/types/notification-mail-content.type.js';
import type { NotificationMailContext } from '../../notifications/types/notification-mail-context.type.js';
import type { NotificationPayloadMap } from '../../notifications/types/notification-payload-map.type.js';
import type { NotificationType } from '../../notifications/types/notification-type.enum.js';

const GRADUATE_FALLBACK_NAME = 'titulado';
const ADMIN_FALLBACK_NAME = 'Administrador';

const loadSurveyMailTemplate = (name: string): string =>
  readFileSync(new URL(`./mjml/${name}.mjml`, import.meta.url), 'utf8');

const SURVEY_REMINDER_MAIL_TEMPLATE = loadSurveyMailTemplate('survey-reminder');
const SURVEY_CLOSING_SOON_MAIL_TEMPLATE = loadSurveyMailTemplate('survey-closing-soon');
const SURVEY_CLOSED_MAIL_TEMPLATE = loadSurveyMailTemplate('survey-closed');
const SURVEY_VARIATION_ALERT_MAIL_TEMPLATE = loadSurveyMailTemplate('survey-variation-alert');

export function renderSurveyReminderMail(
  { surveyTitle, closesAtFormatted }: NotificationPayloadMap[NotificationType.SURVEY_REMINDER],
  { recipientName, actionUrl }: NotificationMailContext,
): NotificationMailContent {
  const name = recipientName || GRADUATE_FALLBACK_NAME;
  return {
    mjml: SURVEY_REMINDER_MAIL_TEMPLATE,
    subject: `Recordatorio: responde la encuesta «${surveyTitle}»`,
    text: `Hola ${name}, aún no respondiste la encuesta «${surveyTitle}». Cierra el: ${closesAtFormatted} Responde en: ${actionUrl}`,
    values: { recipientName: name, surveyTitle, closesAtFormatted, actionUrl },
  };
}

export function renderSurveyClosingSoonMail(
  { surveyTitle, closesAtFormatted, responsesCount }: NotificationPayloadMap[NotificationType.SURVEY_CLOSING_SOON],
  { recipientName, actionUrl }: NotificationMailContext,
): NotificationMailContent {
  const name = recipientName || ADMIN_FALLBACK_NAME;
  return {
    mjml: SURVEY_CLOSING_SOON_MAIL_TEMPLATE,
    subject: `La encuesta «${surveyTitle}» cierra en 3 días`,
    text: `Hola ${name}, este es un aviso sobre una encuesta que creaste. La encuesta «${surveyTitle}» cierra el ${closesAtFormatted}. Respuestas hasta ahora: ${responsesCount}. Ver analíticas en: ${actionUrl}`,
    values: {
      recipientName: name,
      surveyTitle,
      closesAtFormatted,
      responsesCount: String(responsesCount),
      actionUrl,
    },
  };
}

export function renderSurveyClosedMail(
  { surveyTitle, closesAtFormatted, responsesCount }: NotificationPayloadMap[NotificationType.SURVEY_CLOSED],
  { recipientName, actionUrl }: NotificationMailContext,
): NotificationMailContent {
  const name = recipientName || ADMIN_FALLBACK_NAME;
  return {
    mjml: SURVEY_CLOSED_MAIL_TEMPLATE,
    subject: `La encuesta «${surveyTitle}» ya cerró`,
    text: `Hola ${name}, este es un aviso sobre una encuesta que creaste. El periodo de recepción de respuestas para la encuesta «${surveyTitle}» ha concluido. Cerró el: ${closesAtFormatted}. Respuestas recibidas: ${responsesCount} en total. Ver resultados en: ${actionUrl}`,
    values: {
      recipientName: name,
      surveyTitle,
      closesAtFormatted,
      responsesCount: String(responsesCount),
      actionUrl,
    },
  };
}

export function renderSurveyVariationAlertMail(
  { surveyTitle, threshold, summaryText }: NotificationPayloadMap[NotificationType.SURVEY_VARIATION_ALERT],
  { recipientName, actionUrl }: NotificationMailContext,
): NotificationMailContent {
  const name = recipientName || ADMIN_FALLBACK_NAME;
  return {
    mjml: SURVEY_VARIATION_ALERT_MAIL_TEMPLATE,
    subject: `Alerta de variación significativa en «${surveyTitle}»`,
    text: `Hola ${name}, detectamos cambios significativos en los resultados de la encuesta «${surveyTitle}» frente al semestre anterior.\n${summaryText}\nVer analíticas en: ${actionUrl}`,
    values: {
      recipientName: name,
      surveyTitle,
      threshold: String(threshold),
      shiftsContent: summaryText,
      actionUrl,
    },
  };
}
