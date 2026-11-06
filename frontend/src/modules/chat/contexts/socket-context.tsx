"use client";

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import type { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getAccessToken, subscribeAccessToken } from '@/shared/services/storage/access-token-storage';
import { getChatSocket, resetChatSocket } from '../services/chat-socket';

import type { Message, Conversation } from '../types/conversation.types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, () => null);

  useEffect(() => {
    if (!token) return;

    let socketInstance: Socket;
    try {
      socketInstance = getChatSocket();
    } catch {
      return;
    }

    const initTimer = setTimeout(() => {
      setSocket(socketInstance);
      if (socketInstance.connected) setIsConnected(true);
    }, 0);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleConnectError = (err: Error) => {
      setIsConnected(false);
      if (err.message === 'unauthorized') {
        toast.error('Sesión expirada', {
          description: 'Por favor, recarga la página o inicia sesión nuevamente.',
        });
      }
    };

    const handleNewMessage = (message: Message) => {
      queryClient.invalidateQueries({
        queryKey: ['chat', 'messages', message.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['chat', 'conversations'],
      });
    };

    const handleNewConversation = (conversation: Conversation) => {
      queryClient.invalidateQueries({
        queryKey: ['chat', 'conversations'],
      });
      toast.info(`Nueva conversación iniciada por ${conversation.contact?.fullName || 'un usuario'}`);
    };

    const handleNewConnectionRequest = () => {
      queryClient.invalidateQueries({
        queryKey: ['chat', 'connection-requests'],
      });
      toast.info('Has recibido una nueva solicitud de conexión.');
    };

    const handleUpdatedConnectionRequest = () => {
      queryClient.invalidateQueries({
        queryKey: ['chat', 'connection-requests'],
      });
      queryClient.invalidateQueries({
        queryKey: ['chat', 'conversations'],
      });
    };

    socketInstance.on('message:new', handleNewMessage);
    socketInstance.on('conversation:new', handleNewConversation);
    socketInstance.on('connection_request:new', handleNewConnectionRequest);
    socketInstance.on('connection_request:updated', handleUpdatedConnectionRequest);

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);

    return () => {
      clearTimeout(initTimer);
      socketInstance.off('message:new', handleNewMessage);
      socketInstance.off('conversation:new', handleNewConversation);
      socketInstance.off('connection_request:new', handleNewConnectionRequest);
      socketInstance.off('connection_request:updated', handleUpdatedConnectionRequest);
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
      resetChatSocket();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket debe ser usado dentro de un SocketProvider');
  }
  return context;
};