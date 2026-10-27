"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation'; 
import { getAccessToken } from '@/shared/services/storage/access-token-storage';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  let router = useRouter();
  
 
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    router = { push: () => {} } as unknown as ReturnType<typeof useRouter>;
  }

  useEffect(() => {
    const token = getAccessToken(); 
    if (!token) return; 

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    const socketInstance = io(`${backendUrl}/chat`, {
      auth: { token },
      transports: ['websocket'], 
    });

    const initTimer = setTimeout(() => {
      setSocket(socketInstance);
      if (socketInstance.connected) setIsConnected(true);
    }, 0);

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      setIsConnected(false);
      
      if (err.message === 'unauthorized') {
        toast.error('Sesión expirada');
        router.push('/login'); 
      }
    });

    return () => {
      clearTimeout(initTimer);
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [router]);

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