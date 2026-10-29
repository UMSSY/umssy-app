import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/socket-context';

interface UseEventRoomReturn {
  conversationId: string | null;
  isJoined: boolean;
  error: string | null;
  joinEventRoom: (eventId: string) => void;
  leaveEventRoom: () => void;
}

export function useEventRoom(): UseEventRoomReturn {
  const { socket, isConnected } = useSocket();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    cleanupRef.current = () => {
      // Limpiar listeners al desmontar o cambiar de evento
      if (socket) {
        socket.off('event_room:joined');
        socket.off('event_room:error');
      }
      setConversationId(null);
      setIsJoined(false);
      setError(null);
    };

    return cleanupRef.current;
  }, [socket]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Limpiar listeners previos si ya teníamos un eventId
    socket.off('event_room:joined');
    socket.off('event_room:error');

    // Emitir join al montar o cambiar eventId
    // Note: el caller debe invocar joinEventRoom explícitamente

    // Escuchar respuestas del servidor
    socket.on('event_room:joined', (payload: { conversationId: string }) => {
      setConversationId(payload.conversationId);
      setIsJoined(true);
      setError(null);
    });

    socket.on('event_room:error', (payload: { code: string }) => {
      if (payload.code === 'not_registered') {
        toast.error('Solo los asistentes registrados pueden entrar', {
          description: 'No tienes una inscripción confirmada para este evento.',
        });
      } else {
        setError(payload.code ?? 'error_desconocido');
      }
    });

    return () => {
      socket.off('event_room:joined');
      socket.off('event_room:error');
    };
  }, [socket, isConnected]);

  const joinEventRoom = (eventId: string) => {
    if (!socket) return;
    socket.emit('event_room:join', { eventId });
  };

  const leaveEventRoom = () => {
    if (!socket) return;
    setConversationId(null);
    setIsJoined(false);
    // No emitimos 'leave' explícito; el servidor limpiará al desconectar
  };

  return {
    conversationId,
    isJoined,
    error,
    joinEventRoom,
    leaveEventRoom,
  };
}