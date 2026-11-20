import type { Prisma } from '../../../prisma/client.js';

export const APPOINTMENT_NOTIFICATION_SELECT = {
  id: true,
  appointmentId: true,
  recipientId: true,
  attempts: true,
  channel: { select: { title: true } },
} satisfies Prisma.AppointmentNotificationSelect;
