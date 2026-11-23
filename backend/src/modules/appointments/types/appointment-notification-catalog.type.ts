import type { AppointmentNotificationChannel } from '../enums/appointment-notification-channel.enum.js';

export type AppointmentNotificationCatalog = {
  eventId: string;
  statusIds: { pending: string; sent: string; failed: string };
  channelIds: Record<AppointmentNotificationChannel, string>;
};
