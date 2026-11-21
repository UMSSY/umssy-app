import { z } from 'zod';
import type { NotificationPayloadMap } from '../../notifications/types/notification-payload-map.type.js';
import type { NotificationType } from '../../notifications/types/notification-type.enum.js';

const surveyTitle = z.string().trim().min(1).max(150);
const closesAtFormatted = z.string().trim().min(1);
const responsesCount = z.number().int().nonnegative();

export const surveyReminderPayloadSchema = z.object({
  surveyTitle,
  closesAtFormatted,
}) satisfies z.ZodType<NotificationPayloadMap[NotificationType.SURVEY_REMINDER]>;

export const surveyClosingSoonPayloadSchema = z.object({
  surveyTitle,
  closesAtFormatted,
  responsesCount,
}) satisfies z.ZodType<NotificationPayloadMap[NotificationType.SURVEY_CLOSING_SOON]>;

export const surveyClosedPayloadSchema = z.object({
  surveyTitle,
  closesAtFormatted,
  responsesCount,
}) satisfies z.ZodType<NotificationPayloadMap[NotificationType.SURVEY_CLOSED]>;

export const surveyVariationAlertPayloadSchema = z.object({
  surveyTitle,
  threshold: z.number().int().min(1).max(50),
  summaryText: z.string().trim().min(1),
}) satisfies z.ZodType<NotificationPayloadMap[NotificationType.SURVEY_VARIATION_ALERT]>;
