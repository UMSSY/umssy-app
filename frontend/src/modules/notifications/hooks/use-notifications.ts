"use client";

import { useContext, useEffect, useMemo, useSyncExternalStore } from "react";
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
import type { NotificationsSyncMessage } from "../types/notifications-sync-message.types";
import type { UnreadCountResponse } from "../types/unread-count-response.types";
import type { UseNotificationsInboxOptions } from "../types/use-notifications-inbox-options.types";
import { getNotificationCategory } from "../utils/get-notification-category";
import { isInboxNotification } from "../utils/is-inbox-notification";

export type { UseNotificationsInboxOptions } from "../types/use-notifications-inbox-options.types";

const getServerToken = () => null;
const FALLBACK_QUERY_CLIENT = new QueryClient();
const NOTIFICATIONS_SYNC_CHANNEL = "umssy_notifications_sync";
const MAX_BACKEND_INBOX_LIMIT = 100;

function isTestEnvironment(): boolean {
  try {
    if (process.env.NODE_ENV === "test") return true;
  } catch {}
  try {
    const meta = import.meta as unknown as { env?: { TEST?: boolean } };
    if (meta.env?.TEST) return true;
  } catch {}
  try {
    if (typeof globalThis !== "undefined" && "__vitest_worker__" in globalThis) return true;
  } catch {}
  return false;
}

function broadcastNotificationsSync(message: NotificationsSyncMessage): void {
  if (
    typeof window === "undefined" ||
    typeof window.BroadcastChannel === "undefined" ||
    isTestEnvironment()
  ) {
    return;
  }

  try {
    const channel = new window.BroadcastChannel(NOTIFICATIONS_SYNC_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {}
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

    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && typeof window.BroadcastChannel !== "undefined") {
      try {
        channel = new window.BroadcastChannel(NOTIFICATIONS_SYNC_CHANNEL);
        channel.onmessage = (event: MessageEvent<NotificationsSyncMessage>) => {
          const payload = event.data;
          if (!payload) return;

          if (payload.type === "MARK_READ") {
            let markedUnread = false;
            queryClient.setQueriesData<NotificationListResponse>(
              { queryKey: NOTIFICATIONS_QUERY_KEYS.lists() },
              (existing) => {
                if (!existing) return existing;
                return {
                  ...existing,
                  data: existing.data.map((item) => {
                    if (item.id === payload.notificationId) {
                      if (!item.readAt) markedUnread = true;
                      return { ...item, readAt: item.readAt ?? payload.readAt };
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
            } else {
              void queryClient.invalidateQueries({
                queryKey: NOTIFICATIONS_QUERY_KEYS.unreadCount,
              });
            }
          }

          if (payload.type === "MARK_ALL_READ") {
            queryClient.setQueriesData<NotificationListResponse>(
              { queryKey: NOTIFICATIONS_QUERY_KEYS.lists() },
              (existing) => {
                if (!existing) return existing;
                return {
                  ...existing,
                  data: existing.data.map((item) =>
                    item.readAt ? item : { ...item, readAt: payload.readAt },
                  ),
                };
              },
            );
            queryClient.setQueryData<UnreadCountResponse>(
              NOTIFICATIONS_QUERY_KEYS.unreadCount,
              { count: 0 },
            );
          }
        };
      } catch {}
    }

    let socket: Socket | null = null;
    try {
      socket = getNotificationsSocket();
    } catch {}

    const handleUnreadCountUpdated = (payload: UnreadCountResponse) => {
      if (typeof payload?.count === "number") {
        queryClient.setQueryData<UnreadCountResponse>(NOTIFICATIONS_QUERY_KEYS.unreadCount, {
          count: Math.max(0, payload.count),
        });
      }
    };

    const handleNewNotification = (notification: Partial<NotificationResponse>) => {
      if (!notification) return;

      if (!notification.id || !notification.typeCode) {
        void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });
        return;
      }

      if (!isInboxNotification(notification.typeCode)) return;

      const fullNotification = notification as NotificationResponse;

      queryClient.setQueryData<UnreadCountResponse>(
        NOTIFICATIONS_QUERY_KEYS.unreadCount,
        (current) => ({ count: (current?.count ?? 0) + (fullNotification.readAt ? 0 : 1) }),
      );

      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: NOTIFICATIONS_QUERY_KEYS.lists() },
        (existing) => {
          if (!existing) return existing;
          const alreadyExists = existing.data.some((item) => item.id === fullNotification.id);
          if (alreadyExists) return existing;

          return {
            ...existing,
            data: [fullNotification, ...existing.data].slice(0, existing.limit),
            total: typeof existing.total === "number" ? existing.total + 1 : undefined,
          };
        },
      );
    };

    if (socket) {
      socket.on(UNREAD_COUNT_UPDATED_EVENT, handleUnreadCountUpdated);
      socket.on(NOTIFICATION_NEW_EVENT, handleNewNotification);
    }

    return () => {
      if (channel) {
        channel.close();
      }
      if (socket) {
        socket.off(UNREAD_COUNT_UPDATED_EVENT, handleUnreadCountUpdated);
        socket.off(NOTIFICATION_NEW_EVENT, handleNewNotification);
      }
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
      retry: isTest ? false : 3,
    },
    queryClient ?? FALLBACK_QUERY_CLIENT,
  );
}

export function useNotificationsInbox(options: UseNotificationsInboxOptions = {}) {
  const { filter = "ALL", page = 1, limit = 8 } = options;
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);
  const queryClient = useQueryClient();
  const isTest = isTestEnvironment();

  const listQuery = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEYS.list("ALL", 1, MAX_BACKEND_INBOX_LIMIT),
    queryFn: () => getNotifications({ filter: "ALL", page: 1, limit: MAX_BACKEND_INBOX_LIMIT }),
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

      broadcastNotificationsSync({ type: "MARK_READ", notificationId, readAt });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async (targetFilter?: NotificationInboxFilter) => {
      await markAllNotificationsAsRead(targetFilter);
    },
    onSuccess: () => {
      const readAt = new Date().toISOString();

      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: NOTIFICATIONS_QUERY_KEYS.lists() },
        (existing) => {
          if (!existing) return existing;
          return {
            ...existing,
            data: existing.data.map((item) =>
              item.readAt ? item : { ...item, readAt },
            ),
          };
        },
      );

      queryClient.setQueryData<UnreadCountResponse>(
        NOTIFICATIONS_QUERY_KEYS.unreadCount,
        { count: 0 },
      );

      broadcastNotificationsSync({ type: "MARK_ALL_READ", readAt });
    },
  });

  const filteredNotifications = useMemo(() => {
    const inboxItems = (listQuery.data?.data ?? []).filter((item) =>
      isInboxNotification(item.typeCode),
    );

    if (filter === "ALL") {
      return inboxItems;
    }

    return inboxItems.filter((item) => getNotificationCategory(item.typeCode) === filter);
  }, [listQuery.data?.data, filter]);

  const paginatedNotifications = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredNotifications.slice(startIndex, startIndex + limit);
  }, [filteredNotifications, page, limit]);

  return {
    notifications: paginatedNotifications,
    page,
    limit,
    total: filteredNotifications.length,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    markAsRead: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}