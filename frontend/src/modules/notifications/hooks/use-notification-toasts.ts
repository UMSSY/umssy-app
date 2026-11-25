'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getActiveConversationId } from '@/modules/chat';
import {
  getAccessToken,
  subscribeAccessToken,
} from '@/shared/services/storage/access-token-storage';
import {
  hasCookieSession,
  subscribeCookieSession,
} from '@/shared/services/storage/cookie-session-state';
import { NOTIFICATION_NEW_EVENT } from '../constants/notification-socket-events.constants';
import { getNotificationsSocket } from '../services/notifications-socket';
import type { NotificationNewSocketPayload } from '../types/notification-new-socket-payload.types';
import { getNotificationActionLabel } from '../utils/get-notification-action-label';

const getServerToken = () => null;
const getServerFalse = () => false;

function conversationIdOf(actionUrl: string): string | null {
  try {
    return new URL(actionUrl, window.location.origin).searchParams.get('conversationId');
  } catch {
    return null;
  }
}

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
  const cookieSession = useSyncExternalStore(
    subscribeCookieSession,
    hasCookieSession,
    getServerFalse,
  );
  const hasSession = Boolean(token) || cookieSession;

  useEffect(() => {
    if (!hasSession) return;

    let socket;
    try {
      socket = getNotificationsSocket();
    } catch {
      return;
    }

    const handleNewNotification = (data: NotificationNewSocketPayload) => {
      if (!data || typeof data.title !== 'string') return;

      if (typeof window !== 'undefined' && data.actionUrl) {
        const targetConversationId = conversationIdOf(data.actionUrl);
        if (
          targetConversationId &&
          document.visibilityState === 'visible' &&
          targetConversationId === getActiveConversationId()
        ) {
          return;
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
                if (!data.actionUrl) return;
                if (router) {
                  router.push(data.actionUrl);
                } else if (typeof window !== 'undefined') {
                  window.location.assign(data.actionUrl);
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
  }, [hasSession, router]);
}