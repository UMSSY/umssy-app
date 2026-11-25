import { z } from 'zod';
import type { NotificationPayloadMap } from '../../notifications/types/notification-payload-map.type.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';

export const jobOfferPublishedPayloadSchema = z
  .object({
    jobTitle: z.string().min(1),
    companyName: z.string().min(1),
  })
  .strict() satisfies z.ZodType<
  NotificationPayloadMap[NotificationType.JOB_OFFER_PUBLISHED]
>;
