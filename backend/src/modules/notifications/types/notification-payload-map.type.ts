import type { AppointmentParticipantRole } from '../../appointments/enums/appointment-participant-role.enum.js';
import { NotificationType } from './notification-type.enum.js';

export type NotificationPayloadMap = {
  [NotificationType.CHAT_MESSAGE]: { senderName: string; previewText: string; messageCount: number };
  [NotificationType.CHAT_GROUP_MESSAGE]: { groupName: string; senderName: string; previewText: string; messageCount: number };
  [NotificationType.CONNECTION_REQUEST_RECEIVED]: { senderName: string };
  [NotificationType.CONNECTION_REQUEST_ACCEPTED]: { receiverName: string };
  [NotificationType.MENTOR_SLOT_OFFERED]: { offerId: string; expiresAt: string };
  [NotificationType.RADAR_PUBLISHED]: { radarVersion: string; publishedAt: string };
  [NotificationType.APPOINTMENT_CANCELLED]: { date: string; time: string; cancelledByName: string; reason?: string };
  [NotificationType.APPOINTMENT_BOOKED]: { counterpartName: string; date: string; time: string; topic: string; recipientRole: AppointmentParticipantRole };
  [NotificationType.SURVEY_PUBLISHED]: { surveyTitle: string; previousPeriod: string; currentPeriod: string; change: string };
  [NotificationType.SURVEY_REMINDER]: { surveyTitle: string; closesAtFormatted: string };
  [NotificationType.SURVEY_CLOSING_SOON]: { surveyTitle: string; closesAtFormatted: string; responsesCount: number };
  [NotificationType.SURVEY_CLOSED]: { surveyTitle: string; closesAtFormatted: string; responsesCount: number };
  [NotificationType.SURVEY_VARIATION_ALERT]: { surveyTitle: string; threshold: number; summaryText: string };
  [NotificationType.JOB_OFFER_PUBLISHED]: { jobTitle: string; companyName: string };
  [NotificationType.NEW_JOB_APPLICANT]: { jobTitle: string; applicantName: string; applicantCount: number };
  [NotificationType.EVENT_STARTING_SOON]: { eventName: string; time: string };
  [NotificationType.ACCESS_REQUEST_APPROVED]: { studentName: string };
  [NotificationType.COMPANY_ACCESS_REQUEST_APPROVED]: {
    companyName: string;
    requestCode: string;
    activationCode: string;
    expiresInMinutes: string;
    activationUrl: string;
  };
  [NotificationType.COMPANY_ACCESS_REQUEST_OBSERVED]: {
    companyName: string;
    requestCode: string;
    reason: string;
    requestStatusUrl: string;
  };
  [NotificationType.COMPANY_ACCESS_REQUEST_REJECTED]: {
    companyName: string;
    requestCode: string;
    reason: string;
    requestStatusUrl: string;
  };
  [NotificationType.APPLICATION_STATUS_CHANGED]: {
    vacancyTitle: string;
    companyName: string;
    newStatus: string;
  };
};