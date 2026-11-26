import { DEFAULT_NOTIFICATION_CATALOG_DEFINITION } from "../constants/notification-catalog.constants";
import {
  NOTIFICATION_OPEN_DESTINATION_PARAM,
  NOTIFICATION_OPEN_ID_PARAM,
  NOTIFICATION_OPEN_PATH,
} from "../constants/notification-open.constants";
import type { NotificationOpenParams } from "../types/notification-open-params.types";
import { isInternalNotificationLink } from "./is-internal-notification-link";

export function parseNotificationOpenParams(search: string): NotificationOpenParams {
  const params = new URLSearchParams(search);
  const destination = params.get(NOTIFICATION_OPEN_DESTINATION_PARAM);
  const isValidDestination =
    isInternalNotificationLink(destination) && !destination.startsWith(NOTIFICATION_OPEN_PATH);

  return {
    notificationId: params.get(NOTIFICATION_OPEN_ID_PARAM) || null,
    destination: isValidDestination ? destination : DEFAULT_NOTIFICATION_CATALOG_DEFINITION.fallbackPath,
  };
}
