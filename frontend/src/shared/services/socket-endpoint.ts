import { ENV_CONFIG } from '@/shared/config/env.config';

export interface SocketEndpoint {
  serverUrl: string;
  path?: string;
}

const SOCKET_IO_PATH = '/api/socket.io';

export function resolveSocketEndpoint(
  apiUrl: string = ENV_CONFIG.apiUrl || 'http://localhost:8080',
): SocketEndpoint {
  try {
    return { serverUrl: new URL(apiUrl).origin, path: SOCKET_IO_PATH };
  } catch {
    return { serverUrl: apiUrl, path: SOCKET_IO_PATH };
  }
}