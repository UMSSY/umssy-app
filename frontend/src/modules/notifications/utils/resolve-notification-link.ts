import type { NotificationResponse } from "../types/notification-response.types";
import { getNotificationCatalogDefinition } from "./get-notification-catalog-definition";
import { isInternalNotificationLink } from "./is-internal-notification-link";

export function extractInternalNotificationLink(link: string | null | undefined): string | null {
  if (!link || typeof link !== "string") return null;
  const trimmed = link.trim();
  if (isInternalNotificationLink(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const path = url.pathname + url.search + url.hash;
    if (isInternalNotificationLink(path) && path !== "/") {
      return path;
    }
  } catch {
    // No es una URL válida
  }

  return null;
}

export function resolveNotificationLink(notification: Pick<NotificationResponse, "typeCode" | "link">): string {
  const internalLink = extractInternalNotificationLink(notification.link);
  if (internalLink) {
    return internalLink;
  }

  return getNotificationCatalogDefinition(notification.typeCode).fallbackPath;
}
