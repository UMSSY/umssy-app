import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { ENV_CONFIG } from '@/shared/config/env.config';

let chatSocket: Socket | null = null;

export function getChatSocket(): Socket {
  const token = getAccessToken();

  if (!token) {
    throw new Error('No hay una sesión iniciada.');
  }

  if (!chatSocket) {
    chatSocket = io(`${ENV_CONFIG.apiUrl}/chat`, {
      autoConnect: false,
      auth: { token },
      transports: ['websocket'],
    });
  }

  chatSocket.auth = { token };

  if (!chatSocket.connected) {
    chatSocket.connect();
  }

  return chatSocket;
}