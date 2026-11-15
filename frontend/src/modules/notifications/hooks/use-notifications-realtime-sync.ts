'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/modules/chat/contexts/socket-context';
import { UNREAD_COUNT_QUERY_KEY } from './use-notification-unread-count';

const NOTIFICATIONS_LIST_QUERY_KEY = ['notifications', 'list'];

export function useNotificationsRealtimeSync() {
  const queryClient = useQueryClient();
  
  const socketContext = useSocket(); 
  const socket = socketContext?.socket;

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      queryClient.setQueryData<number>(UNREAD_COUNT_QUERY_KEY, (old) => (old ?? 0) + 1);
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_QUERY_KEY });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, queryClient]);
}