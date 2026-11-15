"use client";

import { createElement } from "react";
import { Button } from "@/components/ui/button";
import type { NotificationResponse } from "../types/notification-response.types";
import { formatNotificationTime } from "../utils/format-notification-time";
import { getNotificationActionLabel } from "../utils/get-notification-action-label";
import { getNotificationIcon } from "../utils/get-notification-icon";

export interface NotificationItemProps {
  notification: NotificationResponse;
  onSelect: (notification: NotificationResponse) => void;
}

export function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const isUnread = notification.readAt === null;
  const actionLabel = getNotificationActionLabel(notification.typeCode);
  const formattedTime = formatNotificationTime(notification.createdAt);

  return (
    <article
      className={`flex flex-col gap-3 rounded-xl border px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
        isUnread
          ? "border-slate-200 bg-white shadow-xs"
          : "border-slate-200/80 bg-slate-50/70"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span
          aria-hidden="true"
          className={`mt-2 size-2 shrink-0 rounded-full sm:mt-0 ${
            isUnread ? "bg-red-600" : "bg-transparent"
          }`}
        />
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-100/80 text-slate-700">
          {createElement(getNotificationIcon(notification.typeCode), {
            className: "size-5",
            "aria-hidden": true,
          })}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {notification.title}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
            {notification.body}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 pl-5 sm:pl-0">
        {formattedTime ? (
          <time
            dateTime={notification.createdAt}
            className="text-xs whitespace-nowrap text-slate-400"
          >
            {formattedTime}
          </time>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant={isUnread ? "default" : "outline"}
          onClick={() => onSelect(notification)}
          className={
            isUnread
              ? "bg-[#0B2E59] text-white hover:bg-[#0B2E59]/90"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }
        >
          {actionLabel}
        </Button>
      </div>
    </article>
  );
}