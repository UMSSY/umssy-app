"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  DEFAULT_IDLE_TIMEOUT_SECONDS,
  DEFAULT_WARNING_SECONDS,
  DEFAULT_AUTO_REFRESH_INTERVAL_SECONDS,
} from "../constants/session-timing.constants";
import { executeSharedRefresh } from "../utils/session-refresh-lock";

export interface UseSessionInactivityOptions {
  idleTimeoutSeconds?: number;
  warningSeconds?: number;
  autoRefreshIntervalSeconds?: number;
  absoluteExpiresAt?: string;
  enabled?: boolean;
  onTimeout: () => void;
  onRefresh?: () => Promise<void>;
  checkIntervalMs?: number;
}

export function useSessionInactivity({
  idleTimeoutSeconds = DEFAULT_IDLE_TIMEOUT_SECONDS,
  warningSeconds = DEFAULT_WARNING_SECONDS,
  autoRefreshIntervalSeconds = DEFAULT_AUTO_REFRESH_INTERVAL_SECONDS,
  absoluteExpiresAt,
  enabled = true,
  onTimeout,
  onRefresh,
  checkIntervalMs = 1000,
}: UseSessionInactivityOptions) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(warningSeconds);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastActivityRef = useRef<number>(0);
  const lastRefreshRef = useRef<number>(0);
  const isWarningOpenRef = useRef<boolean>(false);
  const onTimeoutRef = useRef(onTimeout);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    isWarningOpenRef.current = isWarningOpen;
  }, [isWarningOpen]);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const now = Date.now();
    if (lastActivityRef.current === 0) {
      lastActivityRef.current = now;
    }
    if (lastRefreshRef.current === 0) {
      lastRefreshRef.current = now;
    }
  }, []);

  // Actualiza la última actividad del usuario ante interacción
  const recordActivity = useCallback(() => {
    // Si la advertencia ya está abierta, la actividad no la cierra silenciosamente:
    // debe pulsar "Seguir conectado" expresamente (CA5).
    if (!isWarningOpenRef.current) {
      lastActivityRef.current = Date.now();
    }
  }, []);

  // Escucha eventos de actividad del usuario (clics, teclado, scroll, touch)
  useEffect(() => {
    if (!enabled) return;

    const events: (keyof WindowEventMap)[] = [
      "click",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    const handleUserActivity = () => {
      recordActivity();
    };

    events.forEach((eventType) => {
      window.addEventListener(eventType, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((eventType) => {
        window.removeEventListener(eventType, handleUserActivity);
      });
    };
  }, [enabled, recordActivity]);

  // Bucle de comprobación periódica del estado de inactividad
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const idleTimeoutMs = idleTimeoutSeconds * 1000;
      const warningMs = warningSeconds * 1000;
      const warningThresholdMs = idleTimeoutMs - warningMs;
      const lastActive = lastActivityRef.current || now;
      const elapsedMs = now - lastActive;

      let absoluteRemainingMs = Number.POSITIVE_INFINITY;
      if (absoluteExpiresAt) {
        const absTime = new Date(absoluteExpiresAt).getTime();
        if (!isNaN(absTime)) {
          absoluteRemainingMs = absTime - now;
        }
      }

      // 1. Expiración total (inactividad superó el límite o se alcanzó el tope absoluto de 8h)
      if (elapsedMs >= idleTimeoutMs || absoluteRemainingMs <= 0) {
        setIsWarningOpen(false);
        setSecondsLeft(0);
        onTimeoutRef.current();
        return;
      }

      // 2. Ventana de advertencia (falta poco para expirar)
      const idleRemainingSeconds = Math.max(
        0,
        Math.ceil((idleTimeoutMs - elapsedMs) / 1000),
      );
      const absRemainingSeconds = Number.isFinite(absoluteRemainingMs)
        ? Math.max(0, Math.ceil(absoluteRemainingMs / 1000))
        : Number.POSITIVE_INFINITY;

      const effectiveSecondsLeft = Math.min(
        idleRemainingSeconds,
        absRemainingSeconds,
      );

      if (elapsedMs >= warningThresholdMs || absoluteRemainingMs <= warningMs) {
        setIsWarningOpen(true);
        setSecondsLeft(effectiveSecondsLeft);
      } else {
        setIsWarningOpen((prev) => (prev ? false : prev));
        setSecondsLeft(warningSeconds);
      }

      // Renovación automática periódica mientras haya actividad (~10 minutos)
      const autoRefreshIntervalMs = autoRefreshIntervalSeconds * 1000;
      const timeSinceLastRefresh = now - (lastRefreshRef.current || now);
      const hadActivitySinceLastRefresh = lastActive > lastRefreshRef.current;

      if (
        timeSinceLastRefresh >= autoRefreshIntervalMs &&
        hadActivitySinceLastRefresh &&
        !isWarningOpenRef.current &&
        onRefreshRef.current
      ) {
        lastRefreshRef.current = now;
        void executeSharedRefresh(onRefreshRef.current);
      }
    }, checkIntervalMs);

    return () => clearInterval(interval);
  }, [
    enabled,
    idleTimeoutSeconds,
    warningSeconds,
    autoRefreshIntervalSeconds,
    absoluteExpiresAt,
    checkIntervalMs,
  ]);

  // Acción para "Seguir conectado" (CA5)
  const stayConnected = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshRef.current) {
        await executeSharedRefresh(onRefreshRef.current);
      }
      const now = Date.now();
      lastActivityRef.current = now;
      lastRefreshRef.current = now;
      setIsWarningOpen(false);
      setSecondsLeft(warningSeconds);
    } finally {
      setIsRefreshing(false);
    }
  }, [warningSeconds]);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsWarningOpen(false);
    setSecondsLeft(warningSeconds);
  }, [warningSeconds]);

  return {
    isWarningOpen,
    secondsLeft,
    isRefreshing,
    stayConnected,
    resetActivity,
    recordActivity,
  };
}
