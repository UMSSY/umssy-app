"use client";

import { useEffect, useEffectEvent } from "react";

export const AUTH_BROADCAST_CHANNEL = "umssy_auth";

export type AuthCloseReason =
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED"
  | "REFRESH_INVALID"
  | "PASSWORD_CHANGED"
  | string;

export interface AuthBroadcastMessage {
  type: "SESSION_CLOSED" | "LOGOUT" | "SESSION_EXPIRED" | "ACTIVITY";
  reason?: AuthCloseReason;
  timestamp?: number;
}

/**
 * Transmite un evento de autenticación a todas las pestañas abiertas mediante BroadcastChannel.
 */
export function broadcastAuthEvent(message: AuthBroadcastMessage): void {
  if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") {
    return;
  }

  try {
    const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    // Si el navegador bloquea el canal o falla la serialización, no interrumpe el flujo
  }
}

/**
 * Hook para escuchar eventos del canal de autenticación sincronizado entre pestañas.
 */
export function useAuthBroadcastSync(
  onMessage: (message: AuthBroadcastMessage) => void,
): void {
  const handleMessage = useEffectEvent(onMessage);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") {
      return;
    }

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
      channel.onmessage = (event: MessageEvent<AuthBroadcastMessage>) => {
        if (event?.data && typeof event.data === "object") {
          handleMessage(event.data);
        }
      };
    } catch {
      // Ignorar fallo de instanciación
    }

    return () => {
      try {
        channel?.close();
      } catch {
        // Ignorar fallo al cerrar
      }
    };
  }, []);
}

