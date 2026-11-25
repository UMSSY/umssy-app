import { io, type Socket } from 'socket.io-client';
import { resolveSocketEndpoint } from '@/shared/services/socket-endpoint';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { hasCookieSession } from '@/shared/services/storage/cookie-session-state';

let sharedSocket: Socket | null = null;

export function createChatSocket(token?: string | null): Socket {
  const { serverUrl, path } = resolveSocketEndpoint();

  return io(`${serverUrl}/chat`, {
    autoConnect: false,
    withCredentials: true,
    auth: (callback) => {
      const activeToken = getAccessToken() ?? (hasCookieSession() ? null : token);
      callback(activeToken ? { token: activeToken } : {});
    },
    transports: ['websocket'],
    ...(path ? { path } : {}),
  });
}

export function getChatSocket(): Socket {
  const token = getAccessToken();

  if (!token && !hasCookieSession()) {
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
