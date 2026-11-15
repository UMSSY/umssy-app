"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import {
  useNotificationsRealtimeSync,
  useUnreadNotificationsCount,
} from "../hooks/use-notifications";

export function NotificationFloatingBell() {
  useNotificationsRealtimeSync();
  const { data } = useUnreadNotificationsCount();
  const unreadCount = data?.count ?? 0;
  const formattedCount = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Link
      href="/notifications"
      aria-label={
        unreadCount > 0
          ? `Notificaciones pendientes, ${unreadCount} sin leer`
          : "Notificaciones pendientes"
      }
      className="fixed right-6 bottom-6 z-40 inline-flex size-12 items-center justify-center rounded-xl border-2 border-[#0B2E59] bg-white text-[#0B2E59] shadow-md transition-transform hover:scale-105 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2E59]"
    >
      <Bell className="size-6" aria-hidden="true" />
      {unreadCount > 0 ? (
        <span className="absolute -top-2 -right-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] leading-none font-bold text-white shadow-xs">
          {formattedCount}
        </span>
      ) : null}
    </Link>
  );
}