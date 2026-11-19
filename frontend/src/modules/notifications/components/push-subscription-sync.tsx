"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePushNotifications } from "@/shared/hooks/use-push-notifications";
import {
  getAccessToken,
  subscribeAccessToken,
} from "@/shared/services/storage/access-token-storage";
import { notificationPreferencesQuery } from "../utils/notification-preferences-query";

const getServerToken = () => null;

export function PushSubscriptionSync() {
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);
  const { environment, sync } = usePushNotifications();
  const syncedToken = useRef<string | null>(null);

  const { data: preferences } = useQuery({
    ...notificationPreferencesQuery,
    enabled: !!token && environment === "supported",
  });

  useEffect(() => {
    if (!token || environment !== "supported") return;
    if (!preferences?.pushEnabled || syncedToken.current === token) return;

    const controller = new AbortController();
    void sync({ token, signal: controller.signal }).then((isRegistered) => {
      if (isRegistered && !controller.signal.aborted) {
        syncedToken.current = token;
      }
    });

    return () => controller.abort();
  }, [token, environment, preferences?.pushEnabled, sync]);

  return null;
}