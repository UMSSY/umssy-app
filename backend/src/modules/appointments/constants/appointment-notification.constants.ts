import { AppointmentNotificationChannel } from '../enums/appointment-notification-channel.enum.js';

export const APPOINTMENT_NOTIFICATION_MAX_ATTEMPTS = 3;

export const APPOINTMENT_NOTIFICATION_ACTION_URL = '/appointments';

export const APPOINTMENT_NOTIFICATION_GROUP_PREFIX = 'appointment-notification';

export const APPOINTMENT_NOTIFICATION_CHANNELS = [
  AppointmentNotificationChannel.IN_APP,
  AppointmentNotificationChannel.EMAIL,
  AppointmentNotificationChannel.PUSH,
] as const;
