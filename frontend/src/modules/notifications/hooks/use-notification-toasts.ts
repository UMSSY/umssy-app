'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getAccessToken,
  subscribeAccessToken,
} from '@/shared/services/storage/access-token-storage';
import { getNotificationsSocket } from '../services/notifications-socket';

export interface NotificationNewSocketPayload {
  title: string;
  body: string;
  actionUrl?: string;
}

export function getNotificationActionLabel(
  title: string,
  actionUrl?: string,
): string {
  if (!actionUrl) return 'Ver';
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('mensaje')) return 'Ver mensaje';
  if (lowerTitle.includes('aceptada')) return 'Ir a la sala de chat';
  if (lowerTitle.includes('solicitud')) return 'Ver Solicitud';
  return 'Ver';
}

const getServerToken = () => null;

export function useNotificationToasts(): void {
  const router = useRouter();
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

      const actionLabel = getNotificationActionLabel(
        data.title,
        data.actionUrl,
      );

      toast(data.title, {
        description: data.body,
        duration: 7000,
        action: data.actionUrl
          ? {
              label: actionLabel,
              onClick: () => {
                if (data.actionUrl) {
                  router.push(data.actionUrl);
                }
              },
            }
          : undefined,
      });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [token, router]);
}
