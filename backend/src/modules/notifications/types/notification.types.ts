import { NotificationType } from './notification-type.enum.js';

export type NotifyRequest<T = Record<string, unknown>> = {
  recipientIds: string[];
  actorId?: string;
  type: NotificationType;
  payload: T; 
  actionUrl: string;
  groupKey?: string;
};

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