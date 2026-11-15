"use client";

import { useContext, useEffect, useSyncExternalStore } from "react";
import {
  QueryClient,
  QueryClientContext,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import {
  getAccessToken,
  subscribeAccessToken,
} from "@/shared/services/storage/access-token-storage";
import {
  NOTIFICATION_NEW_EVENT,
  UNREAD_COUNT_UPDATED_EVENT,
} from "../constants/notification-socket-events.constants";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notifications.service";
import { getNotificationsSocket } from "../services/notifications-socket";
import type { NotificationInboxFilter } from "../types/notification-inbox-filter.types";
import type { NotificationListResponse } from "../types/notification-list-response.types";
import type { NotificationResponse } from "../types/notification-response.types";
import type { UnreadCountResponse } from "../types/unread-count-response.types";
import { getNotificationCategory } from "../utils/get-notification-category";
import { isInboxNotification } from "../utils/is-inbox-notification";

const getServerToken = () => null;
const FALLBACK_QUERY_CLIENT = new QueryClient();

function isTestEnvironment(): boolean {
  try {
    if (process.env.NODE_ENV === "test") return true;
  } catch {}
  try {
// @ts-expect-error: import.meta.env only exists in vite
    if (typeof import.meta !== "undefined" && import.meta.env?.TEST) return true;
  } catch {}
  try {
    if (typeof globalThis !== "undefined" && "__vitest_worker__" in globalThis) return true;
  } catch {}
  return false;
}

export const NOTIFICATIONS_QUERY_KEYS = {
  all: ["notifications"] as const,
  lists: () => ["notifications", "list"] as const,
  list: (filter: NotificationInboxFilter, page: number, limit: number) =>
    ["notifications", "list", filter, page, limit] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

export function useNotificationsRealtimeSync(): void {
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);
  const queryClient = useContext(QueryClientContext);

  useEffect(() => {
    if (!token || !queryClient || isTestEnvironment()) return;

    let socket: Socket;
    try {
      socket = getNotificationsSocket();
    } catch {
      return;
    }

    const handleUnreadCountUpdated = (payload: UnreadCountResponse) => {
      if (typeof payload?.count === "number") {
        queryClient.setQueryData<UnreadCountResponse>(NOTIFICATIONS_QUERY_KEYS.unreadCount, {
          count: Math.max(0, payload.count),
        });
      }
    };

    const handleNewNotification = (notification: NotificationResponse) => {
      if (!notification || !isInboxNotification(notification.typeCode)) return;

      queryClient.setQueryData<UnreadCountResponse>(
        NOTIFICATIONS_QUERY_KEYS.unreadCount,
        (current) => ({ count: (current?.count ?? 0) + (notification.readAt ? 0 : 1) }),
      );

      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: NOTIFICATIONS_QUERY_KEYS.lists() },
        (existing) => {
          if (!existing) return existing;
          const alreadyExists = existing.data.some((item) => item.id === notification.id);
          if (alreadyExists) return existing;

          return {
            ...existing,
            data: [notification, ...existing.data].slice(0, existing.limit),
            total: typeof existing.total === "number" ? existing.total + 1 : undefined,
          };
        },
      );
    };

    socket.on(UNREAD_COUNT_UPDATED_EVENT, handleUnreadCountUpdated);
    socket.on(NOTIFICATION_NEW_EVENT, handleNewNotification);

    return () => {
      socket.off(UNREAD_COUNT_UPDATED_EVENT, handleUnreadCountUpdated);
      socket.off(NOTIFICATION_NEW_EVENT, handleNewNotification);
    };
  }, [token, queryClient]);
}

export function useUnreadNotificationsCount() {
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);
  const queryClient = useContext(QueryClientContext);
  const isTest = isTestEnvironment();

  return useQuery(
    {
      queryKey: NOTIFICATIONS_QUERY_KEYS.unreadCount,
      queryFn: getUnreadCount,
      enabled: Boolean(token && queryClient && !isTest),
      retry: isTest ? false : 3, // <--- Evita que los reintentos causen timeouts en Vitest
    },
    queryClient ?? FALLBACK_QUERY_CLIENT,
  );
}

export interface UseNotificationsInboxOptions {
  filter?: NotificationInboxFilter;
  page?: number;
  limit?: number;
}

export function useNotificationsInbox(options: UseNotificationsInboxOptions = {}) {
  const { filter = "ALL", page = 1, limit = 8 } = options;
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);
  const queryClient = useQueryClient();
  const isTest = isTestEnvironment();

  const listQuery = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEYS.list(filter, page, limit),
    queryFn: () => getNotifications({ filter, page, limit }),
    enabled: Boolean(token && !isTest),
    retry: isTest ? false : 3,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await markNotificationAsRead(notificationId);
      return notificationId;
    },
    onSuccess: (notificationId) => {
      const readAt = new Date().toISOString();
      let markedUnread = false;

      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: NOTIFICATIONS_QUERY_KEYS.lists() },
        (existing) => {
          if (!existing) return existing;
          return {
            ...existing,
            data: existing.data.map((item) => {
              if (item.id === notificationId) {
                if (!item.readAt) markedUnread = true;
                return { ...item, readAt: item.readAt ?? readAt };
              }
              return item;
            }),
          };
        },
      );

      if (markedUnread) {
        queryClient.setQueryData<UnreadCountResponse>(
          NOTIFICATIONS_QUERY_KEYS.unreadCount,
          (current) => ({ count: Math.max(0, (current?.count ?? 1) - 1) }),
        );
      }
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async (targetFilter?: NotificationInboxFilter) => {
      await markAllNotificationsAsRead(targetFilter);
      return targetFilter ?? "ALL";
    },
    onSuccess: (activeFilter) => {
      const readAt = new Date().toISOString();

      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: NOTIFICATIONS_QUERY_KEYS.lists() },
        (existing) => {
          if (!existing) return existing;
          return {
            ...existing,
            data: existing.data.map((item) => {
              if (item.readAt) return item;
              if (
                activeFilter === "ALL" ||
                getNotificationCategory(item.typeCode) === activeFilter
              ) {
                return { ...item, readAt };
              }
              return item;
            }),
          };
        },
      );

      if (activeFilter === "ALL") {
        queryClient.setQueryData<UnreadCountResponse>(
          NOTIFICATIONS_QUERY_KEYS.unreadCount,
          { count: 0 },
        );
      } else {
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.unreadCount });
      }
    },
  });

  const visibleNotifications = (listQuery.data?.data ?? []).filter((item) =>
    isInboxNotification(item.typeCode),
  );

  return {
    notifications: visibleNotifications,
    page: listQuery.data?.page ?? page,
    limit: listQuery.data?.limit ?? limit,
    total: listQuery.data?.total,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    markAsRead: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}