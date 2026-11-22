"use client";

import { Button } from "@/components/ui/button";
import type { NotificationItemProps } from "../types/notification-item-props.types";
import { formatNotificationTime } from "../utils/format-notification-time";
import { getNotificationActionLabel } from "../utils/get-notification-action-label";
import { getNotificationIcon } from "../utils/get-notification-icon";
import { NotificationCard } from "./notification-card";

export type { NotificationItemProps } from "../types/notification-item-props.types";

export function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const isUnread = notification.readAt === null;

  return (
    <NotificationCard
      icon={getNotificationIcon(notification.typeCode)}
      title={notification.title}
      description={notification.body}
      isHighlighted={isUnread}
      dateTime={notification.createdAt}
      timeLabel={formatNotificationTime(notification.createdAt)}
      action={
        <Button
          type="button"
          size="sm"
          variant={isUnread ? "default" : "outline"}
          onClick={() => onSelect(notification)}
        >
          {getNotificationActionLabel(notification.typeCode)}
        </Button>
      }
    />
  );
}
