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
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken(); 
    if (!token) return; 

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    const socketInstance = io(`${backendUrl}/chat`, {
      auth: { token },
      transports: ['websocket'], 
    });

    const initSocketState = setTimeout(() => {
      setSocket(socketInstance);
      if (socketInstance.connected) setIsConnected(true);
    }, 0);

    socketInstance.on('connect', () => {
      console.log('Conectado exitosamente al namespace /chat');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Desconectado del namespace /chat');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Error de conexión:', err.message);
      setIsConnected(false);
      
      if (err.message === 'unauthorized') {
        toast.error('Sesión expirada', {
          description: 'Por favor, inicia sesión nuevamente.',
        });
        router.push('/login'); 
      }
    });

    
    return () => {
        clearTimeout(initSocketState);
      console.log("Limpiando conexión WebSocket (desmontando)..");
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