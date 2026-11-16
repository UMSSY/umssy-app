'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getAccessToken,
  subscribeAccessToken,
} from '@/shared/services/storage/access-token-storage';
import { NOTIFICATION_NEW_EVENT } from '../constants/notification-socket-events.constants';
import { getNotificationsSocket } from '../services/notifications-socket';
import type { NotificationNewSocketPayload } from '../types/notification-new-socket-payload.types';
import { getNotificationActionLabel } from '../utils/get-notification-action-label';

const getServerToken = () => null;

function useOptionalRouter(): ReturnType<typeof useRouter> | null {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

export function useNotificationToasts(): void {
  const router = useOptionalRouter();
  const token = useSyncExternalStore(
    subscribeAccessToken,
    getAccessToken,
    getServerToken,
  );

  useEffect(() => {
    if (!token) return;

    let socket;
    try {
      socket = getNotificationsSocket();
    } catch {
      return;
    }

    const handleNewNotification = (data: NotificationNewSocketPayload) => {
      if (!data || typeof data.title !== 'string') return;

      if (typeof window !== 'undefined' && data.actionUrl) {
        try {
          const url = new URL(data.actionUrl, window.location.origin);
          const targetConvId = url.searchParams.get('conversationId');
          const activeConvId = (
            window as unknown as { __activeConversationId?: string | null }
          ).__activeConversationId;
          const currentParams = new URLSearchParams(window.location.search);
          const currentUrlConvId = currentParams.get('conversationId');

          if (
            targetConvId &&
            document.visibilityState === 'visible' &&
            (targetConvId === activeConvId || targetConvId === currentUrlConvId)
          ) {
            return;
          }
        } catch {
          // If URL parsing fails, proceed normally
        }
      }

      const actionLabel = getNotificationActionLabel(data.typeCode ?? '');

      toast(data.title, {
        description: data.body,
        duration: 7000,
        action: data.actionUrl
          ? {
              label: actionLabel,
              onClick: () => {
                if (data.actionUrl) {
                  if (router) {
                    router.push(data.actionUrl);
                  } else if (typeof window !== 'undefined') {
                    window.location.assign(data.actionUrl);
                  }
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                      new CustomEvent('app:navigate', {
                        detail: { actionUrl: data.actionUrl },
                      }),
                    );
                  }
                }
              },
            }
          : undefined,
      });
    };

    socket.on(NOTIFICATION_NEW_EVENT, handleNewNotification);

    return () => {
      socket.off(NOTIFICATION_NEW_EVENT, handleNewNotification);
    };
  }, [token, router]);
}