import { io, type Socket } from "socket.io-client";
import { resolveSocketEndpoint } from "@/shared/services/socket-endpoint";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { hasCookieSession } from "@/shared/services/storage/cookie-session-state";

let sharedSocket: Socket | null = null;

function createNotificationsSocket(token?: string | null): Socket {
  const { serverUrl, path } = resolveSocketEndpoint();

  return io(`${serverUrl}/notifications`, {
    autoConnect: false,
    withCredentials: true,
    auth: (callback) => {
      const activeToken = getAccessToken() ?? (hasCookieSession() ? null : token);
      callback(activeToken ? { token: activeToken } : {});
    },
    transports: ["websocket"],
    ...(path ? { path } : {}),
  });
}

export function getNotificationsSocket(): Socket {
  const token = getAccessToken();

  if (!token && !hasCookieSession()) {
    throw new Error("No hay una sesión iniciada.");
  }

  if (!sharedSocket) {
    sharedSocket = createNotificationsSocket(token);
  }

  if (!sharedSocket.connected) {
    sharedSocket.connect();
  }

  return sharedSocket;
}

export function resetNotificationsSocket(): void {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
}
