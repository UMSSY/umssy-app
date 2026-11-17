import type { NotifyChannel } from '../../notifications/types/notify-channel.type.js';
import type { NotifyRequest } from '../../notifications/types/notify-request.type.js';
import type { AppointmentNotificationEvent } from '../enums/appointment-notification-event.enum.js';
import type { AppointmentRecord } from './appointment-record.types.js';

export type AppointmentNotificationDispatch = {
  appointment: AppointmentRecord;
  event: AppointmentNotificationEvent;
  recipientIds: string[];
  buildRequest: (
    recipientId: string,
    channels: NotifyChannel[],
    groupKey: string,
  ) => NotifyRequest;
};
