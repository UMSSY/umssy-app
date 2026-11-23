import { z } from 'zod';
import type { NotificationPayloadMap } from '../../notifications/types/notification-payload-map.type.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';

export const mentorSlotOfferedPayloadSchema = z
  .object({
    offerId: z.string().uuid(),
    expiresAt: z.string().datetime({ offset: true }),
  })
  .strict() satisfies z.ZodType<
  NotificationPayloadMap[NotificationType.MENTOR_SLOT_OFFERED]
>;
