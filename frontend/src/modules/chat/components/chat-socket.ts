import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { ENV_CONFIG } from '@/shared/config/env.config';

let chatSocket: Socket | null = null;

export function getChatSocket(): Socket {
  const token = getAccessToken();

  if (!token) {
    throw new Error('No hay una sesión iniciada.');
  }

  if (!ENV_CONFIG.apiUrl) throw new Error('Falta la URL del backend.');

  if (!chatSocket) {
    chatSocket = io(`${new URL(ENV_CONFIG.apiUrl).origin}/chat`, {
      autoConnect: false,
      auth: (callback) => callback({ token: getAccessToken() }),
      transports: ['websocket'],
    });
  }

  chatSocket.auth = (callback) => callback({ token: getAccessToken() });

  if (!chatSocket.connected) {
    chatSocket.connect();
  }

  return chatSocket;
}