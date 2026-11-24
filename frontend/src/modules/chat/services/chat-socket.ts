import { io, type Socket } from 'socket.io-client';
import { resolveSocketEndpoint } from '@/shared/services/socket-endpoint';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';

let sharedSocket: Socket | null = null;

export function createChatSocket(token: string): Socket {
  const { serverUrl, path } = resolveSocketEndpoint();

  return io(`${serverUrl}/chat`, {
    autoConnect: false,
    auth: (callback) => {
      callback({
        token: getAccessToken() ?? token,
      });
    },
    transports: ['websocket'],
    ...(path ? { path } : {}),
  });
}

export function getChatSocket(): Socket {
  const token = getAccessToken();

  if (!token) {
    throw new Error('No hay una sesión iniciada.');
  }

  if (!sharedSocket) {
    sharedSocket = createChatSocket(token);
  }

  if (!sharedSocket.connected) {
    sharedSocket.connect();
  }

  return sharedSocket;
}

export function resetChatSocket(): void {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
}