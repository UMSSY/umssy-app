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