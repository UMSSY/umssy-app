"use client";

import { createElement } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NotificationItemProps } from "../types/notification-item-props.types";
import { formatNotificationTime } from "../utils/format-notification-time";
import { getNotificationActionLabel } from "../utils/get-notification-action-label";
import { getNotificationIcon } from "../utils/get-notification-icon";

export type { NotificationItemProps } from "../types/notification-item-props.types";

export function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const isUnread = notification.readAt === null;
  const actionLabel = getNotificationActionLabel(notification.typeCode);
  const formattedTime = formatNotificationTime(notification.createdAt);

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between",
        isUnread
          ? "border-border bg-card shadow-xs"
          : "border-border/80 bg-muted/40",
      )}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span
          aria-hidden="true"
          className={cn(
            "mt-2 size-2 shrink-0 rounded-full sm:mt-0",
            isUnread ? "bg-brand-red" : "bg-transparent",
          )}
        />
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/80 text-foreground">
          {createElement(getNotificationIcon(notification.typeCode), {
            className: "size-5",
            "aria-hidden": true,
          })}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {notification.title}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {notification.body}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 pl-5 sm:pl-0">
        {formattedTime ? (
          <time
            dateTime={notification.createdAt}
            className="text-xs whitespace-nowrap text-muted-foreground"
          >
            {formattedTime}
          </time>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant={isUnread ? "default" : "outline"}
          onClick={() => onSelect(notification)}
        >
          {actionLabel}
        </Button>
      </div>
    </article>
  );
}
