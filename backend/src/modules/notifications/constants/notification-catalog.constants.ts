import { NotificationType } from '../types/notification-type.enum.js';

export type NotificationCatalogDefinition = {
  sendsPush: boolean;
  sendsEmail: boolean;
};

export const NOTIFICATION_CATALOG: Record<NotificationType, NotificationCatalogDefinition> = {
  [NotificationType.CHAT_MESSAGE]: { sendsPush: true, sendsEmail: false },
  [NotificationType.CHAT_GROUP_MESSAGE]: { sendsPush: true, sendsEmail: false },
  [NotificationType.CONNECTION_REQUEST_RECEIVED]: { sendsPush: true, sendsEmail: true },
  [NotificationType.CONNECTION_REQUEST_ACCEPTED]: { sendsPush: true, sendsEmail: false },
  [NotificationType.MENTOR_SLOT_OFFERED]: { sendsPush: true, sendsEmail: true },
  [NotificationType.RADAR_PUBLISHED]: { sendsPush: true, sendsEmail: false },
  [NotificationType.APPOINTMENT_CANCELLED]: { sendsPush: true, sendsEmail: true },
  [NotificationType.APPOINTMENT_BOOKED]: { sendsPush: true, sendsEmail: true },
  [NotificationType.SURVEY_PUBLISHED]: { sendsPush: true, sendsEmail: true },
  [NotificationType.APPLICATION_STATUS_CHANGED]: { sendsPush: true, sendsEmail: false },
  [NotificationType.NEW_JOB_APPLICANT]: { sendsPush: true, sendsEmail: true },
  [NotificationType.EVENT_STARTING_SOON]: { sendsPush: true, sendsEmail: false },
  [NotificationType.ACCESS_REQUEST_APPROVED]: { sendsPush: true, sendsEmail: true },
};