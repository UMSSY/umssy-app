"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import {
  useNotificationsRealtimeSync,
  useUnreadNotificationsCount,
} from "../hooks/use-notifications";

export function NotificationBell() {
  useNotificationsRealtimeSync();
  const { data } = useUnreadNotificationsCount();
  const unreadCount = data?.count ?? 0;
  const formattedCount = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Link
      href="/notifications"
      aria-label={
        unreadCount > 0
          ? `Notificaciones, ${unreadCount} sin leer`
          : "Notificaciones"
      }
      className="relative inline-flex size-9 items-center justify-center rounded-md text-app-header-foreground transition-colors hover:bg-app-header-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-header-foreground"
    >
      <Bell className="size-5" aria-hidden="true" />
      {unreadCount > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 py-0.5 text-[11px] leading-none font-semibold text-brand-red-foreground">
          {formattedCount}
        </span>
      ) : null}
    </Link>
  );
}
