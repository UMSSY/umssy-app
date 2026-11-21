import { loadMailTemplate } from '../../mail/helpers/load-mail-template.js';
import type { NotificationMailContent } from '../../notifications/types/notification-mail-content.type.js';
import type { NotificationMailContext } from '../../notifications/types/notification-mail-context.type.js';
import type { NotificationPayloadMap } from '../../notifications/types/notification-payload-map.type.js';
import type { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { toAbsoluteSurveyUrl } from '../utils/survey-frontend-url.js';

const GRADUATE_FALLBACK_NAME = 'titulado';
const ADMIN_FALLBACK_NAME = 'Administrador';

const loadSurveyMailTemplate = (name: string): Promise<string> =>
  loadMailTemplate(new URL(`./mjml/${name}.mjml`, import.meta.url));

export async function renderSurveyReminderMail(
  { surveyTitle, closesAtFormatted }: NotificationPayloadMap[NotificationType.SURVEY_REMINDER],
  { recipientName, actionUrl: contextActionUrl }: NotificationMailContext,
): Promise<NotificationMailContent> {
  const actionUrl = toAbsoluteSurveyUrl(contextActionUrl);
  const name = recipientName || GRADUATE_FALLBACK_NAME;
  return {
    mjml: await loadSurveyMailTemplate('survey-reminder'),
    subject: `Recordatorio: responde la encuesta «${surveyTitle}»`,
    text: `Hola ${name}, aún no respondiste la encuesta «${surveyTitle}». Cierra el: ${closesAtFormatted} Responde en: ${actionUrl}`,
    values: { recipientName: name, surveyTitle, closesAtFormatted, actionUrl },
  };
}

export async function renderSurveyClosingSoonMail(
  { surveyTitle, closesAtFormatted, responsesCount }: NotificationPayloadMap[NotificationType.SURVEY_CLOSING_SOON],
  { recipientName, actionUrl: contextActionUrl }: NotificationMailContext,
): Promise<NotificationMailContent> {
  const actionUrl = toAbsoluteSurveyUrl(contextActionUrl);
  const name = recipientName || ADMIN_FALLBACK_NAME;
  return {
    mjml: await loadSurveyMailTemplate('survey-closing-soon'),
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

export async function renderSurveyClosedMail(
  { surveyTitle, closesAtFormatted, responsesCount }: NotificationPayloadMap[NotificationType.SURVEY_CLOSED],
  { recipientName, actionUrl: contextActionUrl }: NotificationMailContext,
): Promise<NotificationMailContent> {
  const actionUrl = toAbsoluteSurveyUrl(contextActionUrl);
  const name = recipientName || ADMIN_FALLBACK_NAME;
  return {
    mjml: await loadSurveyMailTemplate('survey-closed'),
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

export async function renderSurveyVariationAlertMail(
  { surveyTitle, threshold, summaryText }: NotificationPayloadMap[NotificationType.SURVEY_VARIATION_ALERT],
  { recipientName, actionUrl: contextActionUrl }: NotificationMailContext,
): Promise<NotificationMailContent> {
  const actionUrl = toAbsoluteSurveyUrl(contextActionUrl);
  const name = recipientName || ADMIN_FALLBACK_NAME;
  return {
    mjml: await loadSurveyMailTemplate('survey-variation-alert'),
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

export async function renderSurveyPublishedMail(
  { surveyTitle, currentPeriod, change }: NotificationPayloadMap[NotificationType.SURVEY_PUBLISHED],
  { recipientName, actionUrl: contextActionUrl }: NotificationMailContext,
): Promise<NotificationMailContent> {
  const actionUrl = toAbsoluteSurveyUrl(contextActionUrl);
  const name = recipientName || GRADUATE_FALLBACK_NAME;
  return {
    mjml: await loadSurveyMailTemplate('survey-published'),
    subject: `Nueva encuesta publicada: «${surveyTitle}»`,
    text: `Hola ${name}, ya está disponible la encuesta «${surveyTitle}» del semestre ${currentPeriod}.\n${change}\nVer en: ${actionUrl}`,
    values: { recipientName: name, surveyTitle, currentPeriod, changesContent: change, actionUrl },
  };
}
