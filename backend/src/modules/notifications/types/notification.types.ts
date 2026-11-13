import { NotificationType } from './notification-type.enum.js';

export type NotificationPayloadMap = {
  [NotificationType.CHAT_MESSAGE]: { senderName: string; previewText: string; messageCount: number };
  [NotificationType.CHAT_GROUP_MESSAGE]: { groupName: string; senderName: string; previewText: string; messageCount: number };
  [NotificationType.CONNECTION_REQUEST_RECEIVED]: { senderName: string };
  [NotificationType.CONNECTION_REQUEST_ACCEPTED]: { receiverName: string };
  [NotificationType.MENTOR_SLOT_OFFERED]: { offerId: string; expiresAt: string };
  [NotificationType.RADAR_PUBLISHED]: { radarVersion: string; publishedAt: string };
  [NotificationType.APPOINTMENT_CANCELLED]: { counterpartName: string; date: string; time: string; cancelledByName: string; reason?: string };
  [NotificationType.APPOINTMENT_BOOKED]: { counterpartName: string; date: string; time: string; topic: string };
  [NotificationType.SURVEY_PUBLISHED]: { surveyTitle: string; previousPeriod: string; currentPeriod: string; change: string };
  [NotificationType.APPLICATION_STATUS_CHANGED]: { vacancyTitle: string; companyName: string; newStatus: string };
  [NotificationType.NEW_JOB_APPLICANT]: { jobTitle: string; applicantName: string; applicantCount: number };
  [NotificationType.EVENT_STARTING_SOON]: { eventName: string; time: string };
  [NotificationType.ACCESS_REQUEST_APPROVED]: { studentName: string };
};

export type NotifyRequest = {
  [K in NotificationType]: {
    recipientIds: string[];
    actorId?: string;
    type: K;
    payload: NotificationPayloadMap[K]; 
    actionUrl: string;
    groupKey?: string;
  }
}[NotificationType];

export type NotifyResult = {
  inAppCount: number;
  pushStatus: 'sent' | 'partial' | 'failed' | 'skipped';
  emailStatus: 'sent' | 'partial' | 'failed' | 'skipped';
};

export type NotificationResponse = {
  id: string;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
  typeCode: string;
};

export type NotificationPreferenceResponse = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
};

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
};