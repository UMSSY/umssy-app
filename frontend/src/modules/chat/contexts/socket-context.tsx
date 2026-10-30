"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { getChatSocket, resetChatSocket } from '../components/chat-socket';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
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

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);

    return () => {
      clearTimeout(initTimer);
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
      resetChatSocket();
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

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
