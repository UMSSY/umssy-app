import type { NotificationResponse } from "../types/notification-response.types";
import { getNotificationCatalogDefinition } from "./get-notification-catalog-definition";
import { isInternalNotificationLink } from "./is-internal-notification-link";

function toSameOriginPath(link: string | null | undefined): string | null {
  if (typeof link !== "string" || typeof window === "undefined") {
    return null;
  }

  try {
    const url = new URL(link);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : null;
  } catch {
    return null;
  }
}

export function resolveNotificationLink(notification: Pick<NotificationResponse, "typeCode" | "link">): string {
  if (isInternalNotificationLink(notification.link)) {
    return notification.link;
  }

  const sameOriginPath = toSameOriginPath(notification.link);
  return sameOriginPath !== null && isInternalNotificationLink(sameOriginPath)
    ? sameOriginPath
    : getNotificationCatalogDefinition(notification.typeCode).fallbackPath;
}
