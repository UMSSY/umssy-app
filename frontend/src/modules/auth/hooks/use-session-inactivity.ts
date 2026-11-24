"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  DEFAULT_IDLE_TIMEOUT_SECONDS,
  DEFAULT_WARNING_SECONDS,
  DEFAULT_AUTO_REFRESH_INTERVAL_SECONDS,
} from "../constants/session-timing.constants";
import { readSessionActivity, recordSessionActivity } from "@/shared/utils/session-activity";
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

  // Con la advertencia abierta la sesión solo se extiende pulsando "Seguir conectado"
  const recordActivity = useCallback(() => {
    if (!isWarningOpenRef.current) {
      const now = Date.now();
      lastActivityRef.current = now;
      recordSessionActivity(now);
    }
  }, []);

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

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const idleTimeoutMs = idleTimeoutSeconds * 1000;
      const warningMs = warningSeconds * 1000;
      const warningThresholdMs = idleTimeoutMs - warningMs;
      // La sesión es compartida: cuenta la última actividad de cualquier pestaña.
      // Una marca futura viene de un reloj desfasado y no extiende la sesión.
      const sharedActivity = readSessionActivity();
      const lastActive =
        Math.max(
          lastActivityRef.current,
          sharedActivity > now ? 0 : sharedActivity,
        ) || now;
      const elapsedMs = now - lastActive;

      let absoluteRemainingMs = Number.POSITIVE_INFINITY;
      if (absoluteExpiresAt) {
        const absTime = new Date(absoluteExpiresAt).getTime();
        if (!isNaN(absTime)) {
          absoluteRemainingMs = absTime - now;
        }
      }

      if (elapsedMs >= idleTimeoutMs || absoluteRemainingMs <= 0) {
        setIsWarningOpen(false);
        setSecondsLeft(0);
        onTimeoutRef.current();
        return;
      }

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

  const stayConnected = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshRef.current) {
        await executeSharedRefresh(onRefreshRef.current);
      }
      const now = Date.now();
      lastActivityRef.current = now;
      lastRefreshRef.current = now;
      recordSessionActivity(now);
      setIsWarningOpen(false);
      setSecondsLeft(warningSeconds);
    } finally {
      setIsRefreshing(false);
    }
  }, [warningSeconds]);

  const resetActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    recordSessionActivity(now);
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
