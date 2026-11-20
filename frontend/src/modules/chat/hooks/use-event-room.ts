'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSocket } from '../contexts/socket-context';
import type { EventRoomSummary } from '../types/event-room-summary.types';

interface UseEventRoomReturn {
  conversationId: string | null;
  isJoined: boolean;
  error: string | null;
  room: EventRoomSummary | null;
  joinEventRoom: (registrationId: string) => void;
  leaveEventRoom: () => void;
}

export function useEventRoom(): UseEventRoomReturn {
  const { socket, isConnected } = useSocket();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<EventRoomSummary | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleJoined = (payload: EventRoomSummary) => {
      setConversationId(payload.conversationId);
      setIsJoined(true);
      setError(null);
      setRoom(payload);
    };

    const handleError = (payload: { code: string }) => {
      if (payload.code === 'not_registered') {
        toast.error('Solo los asistentes registrados pueden entrar', {
          description: 'No tienes una inscripción confirmada para este evento.',
        });
      }

      setError(payload.code ?? 'error_desconocido');
    };

    socket.on('event_room:joined', handleJoined);
    socket.on('event_room:error', handleError);

    return () => {
      socket.off('event_room:joined', handleJoined);
      socket.off('event_room:error', handleError);
    };
  }, [socket, isConnected]);

  const joinEventRoom = useCallback(
    (registrationId: string) => {
      if (!socket) return;
      socket.emit('event_room:join', { registrationId });
    },
    [socket],
  );

  const leaveEventRoom = useCallback(() => {
    setConversationId(null);
    setIsJoined(false);
    setError(null);
    setRoom(null);
  }, []);

  return {
    conversationId,
    isJoined,
    error,
    room,
    joinEventRoom,
    leaveEventRoom,
  };
}
