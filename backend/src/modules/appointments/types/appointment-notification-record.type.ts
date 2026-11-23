import type { Prisma } from '../../../prisma/client.js';
import type { APPOINTMENT_NOTIFICATION_SELECT } from '../constants/appointment-notification-select.constants.js';

export type AppointmentNotificationRecord = Prisma.AppointmentNotificationGetPayload<{
  select: typeof APPOINTMENT_NOTIFICATION_SELECT;
}>;
