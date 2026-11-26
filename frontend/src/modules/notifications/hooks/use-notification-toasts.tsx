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
import { ChatMessageToast } from '../components/chat-message-toast';
import {
  CHAT_MESSAGE_TOAST_DURATION_MS,
  CHAT_MESSAGE_TOAST_TYPES,
} from '../constants/chat-message-toast.constants';
import {
  hasCookieSession,
  subscribeCookieSession,
} from '@/shared/services/storage/cookie-session-state';
import { NOTIFICATION_NEW_EVENT } from '../constants/notification-socket-events.constants';
import { getNotificationsSocket } from '../services/notifications-socket';
import type { NotificationNewSocketPayload } from '../types/notification-new-socket-payload.types';
import { getChatToastTitle } from '../utils/get-chat-toast-title';
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
      const openAction = () => {
        if (!data.actionUrl) return;
        if (router) {
          router.push(data.actionUrl);
        } else if (typeof window !== 'undefined') {
          window.location.assign(data.actionUrl);
        }
      };

      if (CHAT_MESSAGE_TOAST_TYPES.has(data.typeCode ?? '')) {
        toast.custom(
          (toastId) => (
            <ChatMessageToast
              title={getChatToastTitle(data.title)}
              preview={data.body}
              siteLabel={typeof window !== 'undefined' ? window.location.hostname : ''}
              actionLabel={actionLabel}
              onOpen={
                data.actionUrl
                  ? () => {
                      toast.dismiss(toastId);
                      openAction();
                    }
                  : undefined
              }
              onClose={() => toast.dismiss(toastId)}
            />
          ),
          { duration: CHAT_MESSAGE_TOAST_DURATION_MS },
        );
        return;
      }

      toast(data.title, {
        description: data.body,
        icon: getToastIcon(data.typeCode),
        duration: 7000,
        action: data.actionUrl
          ? { label: actionLabel, onClick: openAction }
          : undefined,
      });
    };

    socket.on(NOTIFICATION_NEW_EVENT, handleNewNotification);

    return () => {
      socket.off(NOTIFICATION_NEW_EVENT, handleNewNotification);
    };
  }, [hasSession, router]);
}