
import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { ENV_CONFIG } from '@/shared/config/env.config';

let sharedSocket: Socket | null = null;

export function resolveSocketEndpoint(
  apiUrl: string = ENV_CONFIG.apiUrl || 'http://localhost:8080',
): {
  serverUrl: string;
  path?: string;
} {
  try {
    const parsed = new URL(apiUrl);
    const serverUrl = parsed.origin;

    return { serverUrl, path: '/api/socket.io' };
  } catch {
    return { serverUrl: apiUrl, path: '/api/socket.io' };
  }
}

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
