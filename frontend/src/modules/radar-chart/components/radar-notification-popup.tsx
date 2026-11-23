
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { getNotificationsSocket } from '@/modules/notifications/services/notifications-socket';
import { NOTIFICATION_NEW_EVENT } from '@/modules/notifications/constants/notification-socket-events.constants';
import type { NotificationNewSocketPayload } from '@/modules/notifications/types/notification-new-socket-payload.types';
import {
  radarQueryKeys,
  useRadarNotifications,
  useRadarNotificationMutations,
} from '../hooks/use-radar-integration-queries';
import type { RadarNotification } from '../types/radar-notification.types';
import { RadarNotificationCard } from './radar-notification-card';

interface ActiveNotification {
  notification: RadarNotification;
  actionUrl: string;
}

export function RadarNotificationPopup() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useRadarNotifications();

  const { openNotification } = useRadarNotificationMutations();

  const [activeNotification, setActiveNotification] =
    useState<ActiveNotification | null>(null);

  useEffect(() => {
    let mounted = true;

    let socket;

    try {
      socket = getNotificationsSocket();
    } catch {
      return;
    }

    const handleNewNotification = (payload: NotificationNewSocketPayload) => {
      if (
        payload.typeCode !== 'RADAR_PUBLISHED' ||
        !payload.actionUrl?.startsWith('/profile/radar?snapshot=')
      ) {
        return;
      }

      const actionUrl = payload.actionUrl;

      void (async () => {
        try {
          await queryClient.invalidateQueries({
            queryKey: radarQueryKeys.notifications(),
          });

          if (!mounted) return;

          const snapshotId = actionUrl.match(
            /^\/profile\/radar\?snapshot=([0-9a-f-]{36})$/i,
          )?.[1];

          if (!snapshotId) return;

          const notifications =
            queryClient.getQueryData<RadarNotification[]>(
              radarQueryKeys.notifications(),
            ) ?? [];

          const matchingNotification = notifications.find(
            (notification) => notification.snapshotId === snapshotId,
          );

          if (!matchingNotification) return;

          setActiveNotification({
            notification: matchingNotification,
            actionUrl,
          });
        } catch {
          // La consulta podrá reintentarse mediante el siguiente evento.
        }
      })();
    };

    socket.on(NOTIFICATION_NEW_EVENT, handleNewNotification);

    return () => {
      mounted = false;
      socket.off(NOTIFICATION_NEW_EVENT, handleNewNotification);
    };
  }, [queryClient]);

  const handleOpenNotification = async () => {
    if (!activeNotification || openNotification.isPending) return;

    try {
      await openNotification.mutateAsync(
        activeNotification.notification.id,
      );

      const actionUrl = activeNotification.actionUrl;

      setActiveNotification(null);
      router.push(actionUrl);
    } catch {
      // La tarjeta permanece visible para permitir reintentar.
    }
  };

  if (!activeNotification) return null;

  return (
    <div className="absolute top-full right-0 z-50 mt-2 w-[min(24rem,calc(100vw-1.5rem))]">
      <RadarNotificationCard
        notification={activeNotification.notification}
        onClose={() => setActiveNotification(null)}
        onOpen={() => {
          void handleOpenNotification();
        }}
        isOpening={openNotification.isPending}
      />
    </div>
  );
}