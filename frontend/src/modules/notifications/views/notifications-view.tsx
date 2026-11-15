"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NOTIFICATION_INBOX_FILTER_LABELS,
  NOTIFICATION_INBOX_FILTERS,
} from "../constants/notification-inbox-filters.constants";
import {
  useNotificationsInbox,
  useUnreadNotificationsCount,
} from "../hooks/use-notifications";
import type { NotificationInboxFilter } from "../types/notification-inbox-filter.types";
import type { NotificationResponse } from "../types/notification-response.types";
import { getNotificationCategory } from "../utils/get-notification-category";
import { groupNotificationsByDate } from "../utils/group-notifications-by-date";
import { resolveNotificationLink } from "../utils/resolve-notification-link";
import { NotificationItem } from "../components/notification-item";
import { NotificationBell } from "../components/notification-bell";

const PAGE_SIZE = 8;

function isValidInboxFilter(value: string | null): value is NotificationInboxFilter {
  return value !== null && (NOTIFICATION_INBOX_FILTERS as readonly string[]).includes(value);
}

export function NotificationsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFilter = searchParams.get("filter");
  const activeFilter: NotificationInboxFilter = isValidInboxFilter(queryFilter)
    ? queryFilter
    : "ALL";
  const [page, setPage] = useState(1);

  const { data: unreadData } = useUnreadNotificationsCount();
  const unreadCount = unreadData?.count ?? 0;

  const {
    notifications,
    total,
    isLoading,
    isError,
    refetch,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
  } = useNotificationsInbox({
    filter: activeFilter,
    page,
    limit: PAGE_SIZE,
  });

  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(notifications),
    [notifications],
  );

  const unreadByCategory = useMemo(() => {
    const counts: Partial<Record<NotificationInboxFilter, number>> = {};
    for (const item of notifications) {
      if (!item.readAt) {
        const category = getNotificationCategory(item.typeCode);
        if (category !== "CHAT") {
          counts[category] = (counts[category] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [notifications]);

  const totalItems = typeof total === "number" ? total : notifications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const rangeStart = notifications.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = (page - 1) * PAGE_SIZE + notifications.length;
  const hasNextPage =
    typeof total === "number" ? page < totalPages : notifications.length === PAGE_SIZE;

  const handleFilterChange = (filter: NotificationInboxFilter) => {
    setPage(1);
    router.push(filter === "ALL" ? "/notifications" : `/notifications?filter=${filter}`);
  };

  const handleSelectNotification = async (notification: NotificationResponse) => {
    const targetUrl = resolveNotificationLink(notification);
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }
    router.push(targetUrl);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(activeFilter);
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B2E59] sm:text-3xl">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tu historial de avisos, de la más reciente a la más antigua.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={unreadCount === 0 || isMarkingAllAsRead}
          onClick={handleMarkAllAsRead}
          className="gap-2 self-start border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        >
          <CheckCheck className="size-4" aria-hidden="true" />
          Marcar todas como leídas
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filtrar notificaciones por categoría"
          className="flex flex-wrap items-center gap-2"
        >
          {NOTIFICATION_INBOX_FILTERS.map((filterKey) => {
            const isActive = activeFilter === filterKey;
            const badgeCount =
              filterKey === "ALL" ? unreadCount : (unreadByCategory[filterKey] ?? 0);
            return (
              <Button
                key={filterKey}
                type="button"
                role="tab"
                size="sm"
                variant={isActive ? "default" : "outline"}
                aria-selected={isActive}
                onClick={() => handleFilterChange(filterKey)}
                className={`gap-2 rounded-full px-4 text-xs ${
                  isActive
                    ? "border-[#0B2E59] bg-[#0B2E59] text-white hover:bg-[#0B2E59]/90"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{NOTIFICATION_INBOX_FILTER_LABELS[filterKey]}</span>
                {badgeCount > 0 ? (
                  <span
                    className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold ${
                      isActive
                        ? "bg-white text-[#0B2E59]"
                        : "bg-[#0B2E59] text-white"
                    }`}
                  >
                    {badgeCount}
                  </span>
                ) : null}
              </Button>
            );
          })}
        </div>

        <span className="text-xs font-medium text-slate-500">
          {unreadCount} sin leer
        </span>
      </div>

      {isLoading ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-18 animate-pulse rounded-xl border border-slate-200 bg-slate-100/80"
            />
          ))}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50/60 px-6 py-10 text-center"
        >
          <p className="text-sm font-medium text-red-800">
            No se pudieron cargar tus notificaciones.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : groupedNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Bell className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-2 text-base font-semibold text-slate-900">
            No tienes notificaciones
          </h2>
          <p className="max-w-sm text-xs text-slate-500">
            Cuando recibas nuevos avisos sobre encuestas, recordatorios o actividad de tu cuenta, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groupedNotifications.map((group) => (
            <div key={group.key} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  {group.label}
                </h2>
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
                  {group.items.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {group.items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onSelect={handleSelectNotification}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && notifications.length > 0 ? (
        <footer className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
          <p className="text-xs text-slate-500">
            {typeof total === "number"
              ? `Mostrando ${rangeStart}–${rangeEnd} de ${total} notificaciones`
              : `Mostrando ${notifications.length} notificaciones`}
          </p>

          <nav aria-label="Paginación de notificaciones" className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="gap-1 border-slate-200 bg-white text-slate-700"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Anterior
            </Button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
              const isCurrent = pageNumber === page;
              return (
                <Button
                  key={pageNumber}
                  type="button"
                  size="sm"
                  variant={isCurrent ? "default" : "outline"}
                  aria-current={isCurrent ? "page" : undefined}
                  onClick={() => setPage(pageNumber)}
                  className={`size-8 px-0 text-xs ${
                    isCurrent
                      ? "border-[#0B2E59] bg-[#0B2E59] text-white hover:bg-[#0B2E59]/90"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNumber}
                </Button>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasNextPage}
              onClick={() => setPage((current) => current + 1)}
              className="gap-1 border-slate-200 bg-white text-slate-700"
            >
              Siguiente
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </nav>
        </footer>
      ) : null}

      <NotificationBell variant="floating" /> 
    </section>
  );
}