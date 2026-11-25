'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MessageCircle, UserCheck, UserPlus } from 'lucide-react';
import { getActiveConversationId } from '@/modules/chat';
import {
  getAccessToken,
  subscribeAccessToken,
} from '@/shared/services/storage/access-token-storage';
import { NOTIFICATION_NEW_EVENT } from '../constants/notification-socket-events.constants';
import { getNotificationsSocket } from '../services/notifications-socket';
import type { NotificationNewSocketPayload } from '../types/notification-new-socket-payload.types';
import { getNotificationActionLabel } from '../utils/get-notification-action-label';
import { getNotificationIcon } from '../utils/get-notification-icon';

function getToastIcon(typeCode?: string) {
  const IconComponent = (() => {
    switch (typeCode) {
      case 'CONNECTION_REQUEST_RECEIVED':
        return UserPlus;
      case 'CONNECTION_REQUEST_ACCEPTED':
        return UserCheck;
      case 'CHAT_MESSAGE':
      case 'CHAT_GROUP_MESSAGE':
        return MessageCircle;
      default:
        return getNotificationIcon(typeCode ?? '');
    }
  })();

  return <IconComponent className="size-6 text-primary" strokeWidth={1.75} />;
}

const getServerToken = () => null;

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
      const toastIcon = getToastIcon(data.typeCode);

      toast(data.title, {
        description: data.body,
        icon: toastIcon,
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
  }, [token, router]);
}