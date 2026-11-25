import { z } from 'zod';
import type { NotificationPayloadMap } from '../../notifications/types/notification-payload-map.type.js';
import type { NotificationType } from '../../notifications/types/notification-type.enum.js';

export const companyRequestApprovedPayloadSchema = z.object({
  companyName: z.string().trim().min(1),
  requestCode: z.string().trim().min(1),
  activationCode: z.string().trim().min(1),
  expiresInMinutes: z.string().trim().min(1),
  activationUrl: z.string().trim().min(1),
}) satisfies z.ZodType<
  NotificationPayloadMap[NotificationType.COMPANY_ACCESS_REQUEST_APPROVED]
>;

export const companyRequestObservedPayloadSchema = z.object({
  companyName: z.string().trim().min(1),
  requestCode: z.string().trim(),
  reason: z.string().trim().min(1),
  requestStatusUrl: z.string().trim().min(1),
}) satisfies z.ZodType<
  NotificationPayloadMap[NotificationType.COMPANY_ACCESS_REQUEST_OBSERVED]
>;

export const companyRequestRejectedPayloadSchema = z.object({
  companyName: z.string().trim().min(1),
  requestCode: z.string().trim(),
  reason: z.string().trim().min(1),
  requestStatusUrl: z.string().trim().min(1),
}) satisfies z.ZodType<
  NotificationPayloadMap[NotificationType.COMPANY_ACCESS_REQUEST_REJECTED]
>;
