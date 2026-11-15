"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const filterParam = searchParams.get("filter");
  const activeFilter: NotificationInboxFilter = isValidInboxFilter(filterParam)
    ? filterParam
    : "ALL";

  const [page, setPage] = useState(1);

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

  const { data: unreadData } = useUnreadNotificationsCount();
  const unreadCount = unreadData?.count ?? 0;

  const { notifications: allInboxItems } = useNotificationsInbox({
    filter: "ALL",
    page: 1,
    limit: 100,
  });

  const unreadByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of allInboxItems) {
      if (!item.readAt) {
        const cat = getNotificationCategory(item.typeCode);
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
    }
    return counts;
  }, [allInboxItems]);

  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(notifications),
    [notifications],
  );

  const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));
  const hasNextPage = page < totalPages;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

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
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu historial de avisos, de la más reciente a la más antigua.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={unreadCount === 0 || isMarkingAllAsRead}
          onClick={handleMarkAllAsRead}
          className="gap-2 self-start"
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
                className="gap-2 rounded-full px-4 text-xs"
              >
                <span>{NOTIFICATION_INBOX_FILTER_LABELS[filterKey]}</span>
                {badgeCount > 0 ? (
                  <span
                    className={cn(
                      "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold",
                      isActive
                        ? "bg-primary-foreground text-primary"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {badgeCount}
                  </span>
                ) : null}
              </Button>
            );
          })}
        </div>

        <span className="text-xs font-medium text-muted-foreground">
          {unreadCount} sin leer
        </span>
      </div>

      {isLoading ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-18 animate-pulse rounded-xl border border-border bg-muted/60"
            />
          ))}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-6 py-10 text-center"
        >
          <p className="text-sm font-medium text-destructive">
            No se pudieron cargar tus notificaciones.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : groupedNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Bell className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-2 text-base font-semibold text-foreground">
            No tienes notificaciones
          </h2>
          <p className="max-w-sm text-xs text-muted-foreground">
            Cuando recibas nuevos avisos sobre encuestas, recordatorios o actividad de tu cuenta, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groupedNotifications.map((group) => (
            <div key={group.key} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {group.label}
                </h2>
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
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
        <footer className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
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
              className="gap-1"
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
                  className="size-8 px-0 text-xs"
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
              className="gap-1"
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
