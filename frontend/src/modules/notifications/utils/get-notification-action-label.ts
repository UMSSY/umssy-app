import {
  DEFAULT_NOTIFICATION_ACTION_LABEL,
  NOTIFICATION_ACTION_LABELS,
} from "../constants/notification-action-labels.constants";
import { isNotificationType } from "./is-notification-type";

export function getNotificationActionLabel(typeCode: string): string {
  return isNotificationType(typeCode)
    ? NOTIFICATION_ACTION_LABELS[typeCode]
    : DEFAULT_NOTIFICATION_ACTION_LABEL;
}