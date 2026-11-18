import { useEffect, useSyncExternalStore } from "react";
import type { Socket } from "socket.io-client";
import { getAccessToken, subscribeAccessToken } from "@/shared/services/storage/access-token-storage";
import { VISIBILITY_CHANGED_EVENT } from "../constants/notification-socket-events.constants";
import { getNotificationsSocket, resetNotificationsSocket } from "../services/notifications-socket";
import { isAppVisible } from "../utils/is-app-visible";

const getServerToken = () => null;

export function useAppVisibilityReport(): void {
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);

  useEffect(() => {
    if (!token) return;

    let socket: Socket;
    try {
      socket = getNotificationsSocket();
    } catch {
      return;
    }

    const reportVisibility = () => {
      socket.emit(VISIBILITY_CHANGED_EVENT, { visible: isAppVisible() });
    };
    // Sin conexión no se emite: al reconectar se informa el estado actual.
    const handleVisibilityChange = () => {
      if (socket.connected) reportVisibility();
    };

    socket.on("connect", reportVisibility);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (socket.connected) reportVisibility();

    return () => {
      socket.off("connect", reportVisibility);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      resetNotificationsSocket();
    };
  }, [token]);
}
