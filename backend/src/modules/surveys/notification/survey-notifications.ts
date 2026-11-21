import type { NotificationPayloadMap } from '../../notifications/types/notification-payload-map.type.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import {
  renderSurveyClosedMail,
  renderSurveyClosingSoonMail,
  renderSurveyReminderMail,
  renderSurveyVariationAlertMail,
} from './survey-notification-mails.js';
import {
  surveyClosedPayloadSchema,
  surveyClosingSoonPayloadSchema,
  surveyReminderPayloadSchema,
  surveyVariationAlertPayloadSchema,
} from './survey-notification-payloads.schema.js';
import type { SurveyNotification } from '../types/survey-notification.type.js';

export function surveyReminderNotification(
  input: NotificationPayloadMap[NotificationType.SURVEY_REMINDER],
): SurveyNotification<NotificationType.SURVEY_REMINDER> {
  const payload = surveyReminderPayloadSchema.parse(input);
  return {
    type: NotificationType.SURVEY_REMINDER,
    payload,
    renderMail: (context) => renderSurveyReminderMail(payload, context),
  };
}

export function surveyClosingSoonNotification(
  input: NotificationPayloadMap[NotificationType.SURVEY_CLOSING_SOON],
): SurveyNotification<NotificationType.SURVEY_CLOSING_SOON> {
  const payload = surveyClosingSoonPayloadSchema.parse(input);
  return {
    type: NotificationType.SURVEY_CLOSING_SOON,
    payload,
    renderMail: (context) => renderSurveyClosingSoonMail(payload, context),
  };
}

export function surveyClosedNotification(
  input: NotificationPayloadMap[NotificationType.SURVEY_CLOSED],
): SurveyNotification<NotificationType.SURVEY_CLOSED> {
  const payload = surveyClosedPayloadSchema.parse(input);
  return {
    type: NotificationType.SURVEY_CLOSED,
    payload,
    renderMail: (context) => renderSurveyClosedMail(payload, context),
  };
}

export function surveyVariationAlertNotification(
  input: NotificationPayloadMap[NotificationType.SURVEY_VARIATION_ALERT],
): SurveyNotification<NotificationType.SURVEY_VARIATION_ALERT> {
  const payload = surveyVariationAlertPayloadSchema.parse(input);
  return {
    type: NotificationType.SURVEY_VARIATION_ALERT,
    payload,
    renderMail: (context) => renderSurveyVariationAlertMail(payload, context),
  };
}
