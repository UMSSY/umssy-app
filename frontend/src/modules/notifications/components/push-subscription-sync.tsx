"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePushNotifications } from "@/shared/hooks/use-push-notifications";
import {
  getAccessToken,
  subscribeAccessToken,
} from "@/shared/services/storage/access-token-storage";
import {
  hasCookieSession,
  subscribeCookieSession,
} from "@/shared/services/storage/cookie-session-state";
import { notificationPreferencesQuery } from "../utils/notification-preferences-query";

const getServerToken = () => null;
const getServerFalse = () => false;

export function PushSubscriptionSync() {
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);
  const cookieSession = useSyncExternalStore(
    subscribeCookieSession,
    hasCookieSession,
    getServerFalse,
  );
  const sessionKey = token ?? (cookieSession ? "cookie" : null);
  const { environment, sync } = usePushNotifications();
  const syncedSession = useRef<string | null>(null);

  const { data: preferences } = useQuery({
    ...notificationPreferencesQuery,
    enabled: Boolean(sessionKey) && environment === "supported",
  });

  useEffect(() => {
    if (!sessionKey || environment !== "supported") return;
    if (!preferences?.pushEnabled || syncedSession.current === sessionKey) return;

    const controller = new AbortController();
    void sync({ token, signal: controller.signal }).then((isRegistered) => {
      if (isRegistered && !controller.signal.aborted) {
        syncedSession.current = sessionKey;
      }
    });

    return () => controller.abort();
  }, [sessionKey, token, environment, preferences?.pushEnabled, sync]);

  return null;
}