"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  DEFAULT_IDLE_TIMEOUT_SECONDS,
  DEFAULT_WARNING_SECONDS,
  DEFAULT_AUTO_REFRESH_INTERVAL_SECONDS,
} from "../constants/session-timing.constants";
import { executeSharedRefresh } from "../utils/session-refresh-lock";
import { broadcastAuthEvent, useAuthBroadcastSync } from "../utils/auth-broadcast";
import {
  readSharedLastActivity,
  SESSION_LAST_ACTIVITY_KEY,
  writeSharedLastActivity,
} from "@/shared/services/storage/session-activity-storage";

const ACTIVITY_SYNC_THROTTLE_MS = 2000;

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
  const lastBroadcastRef = useRef<number>(0);
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
    if (!enabled) return;
    const now = Date.now();
    const shared = readSharedLastActivity();
    lastActivityRef.current = Math.max(now, shared ?? 0);
    lastBroadcastRef.current = 0;
    writeSharedLastActivity(lastActivityRef.current);
    if (lastRefreshRef.current === 0) {
      lastRefreshRef.current = now;
    }
  }, [enabled]);

  const syncSharedActivity = useCallback((timestamp: number, force = false) => {
    writeSharedLastActivity(timestamp);
    if (force || timestamp - lastBroadcastRef.current >= ACTIVITY_SYNC_THROTTLE_MS) {
      lastBroadcastRef.current = timestamp;
      broadcastAuthEvent({ type: "ACTIVITY", timestamp });
    }
  }, []);

  const applyRemoteActivity = useCallback(
    (timestamp: number) => {
      if (timestamp <= lastActivityRef.current) return;
      lastActivityRef.current = timestamp;
      setIsWarningOpen(false);
      setSecondsLeft(warningSeconds);
    },
    [warningSeconds],
  );

  useAuthBroadcastSync((message) => {
    if (!enabled || message.type !== "ACTIVITY") return;
    applyRemoteActivity(message.timestamp ?? Date.now());
  });

  const recordActivity = useCallback(() => {
    if (isWarningOpenRef.current) return;
    const now = Date.now();
    lastActivityRef.current = now;
    syncSharedActivity(now);
  }, [syncSharedActivity]);

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

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_LAST_ACTIVITY_KEY || !event.newValue) return;
      const timestamp = Number(event.newValue);
      if (Number.isSafeInteger(timestamp) && timestamp > 0) {
        applyRemoteActivity(timestamp);
      }
    };

    events.forEach((eventType) => {
      window.addEventListener(eventType, handleUserActivity, { passive: true });
    });
    window.addEventListener("storage", handleStorage);

    return () => {
      events.forEach((eventType) => {
        window.removeEventListener(eventType, handleUserActivity);
      });
      window.removeEventListener("storage", handleStorage);
    };
  }, [enabled, recordActivity, applyRemoteActivity]);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const idleTimeoutMs = idleTimeoutSeconds * 1000;
      const warningMs = warningSeconds * 1000;
      const warningThresholdMs = idleTimeoutMs - warningMs;
      const sharedLastActive = readSharedLastActivity();
      const lastActive = Math.max(
        lastActivityRef.current || now,
        sharedLastActive ?? 0,
      );
      if (lastActive > lastActivityRef.current) {
        lastActivityRef.current = lastActive;
      }
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
      syncSharedActivity(now, true);
      setIsWarningOpen(false);
      setSecondsLeft(warningSeconds);
    } finally {
      setIsRefreshing(false);
    }
  }, [warningSeconds, syncSharedActivity]);

  const resetActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    syncSharedActivity(now, true);
    setIsWarningOpen(false);
    setSecondsLeft(warningSeconds);
  }, [warningSeconds, syncSharedActivity]);

  return {
    isWarningOpen,
    secondsLeft,
    isRefreshing,
    stayConnected,
    resetActivity,
    recordActivity,
  };
}
