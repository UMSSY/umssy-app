"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePushNotifications } from "@/shared/hooks/use-push-notifications";
import {
  getAccessToken,
  subscribeAccessToken,
} from "@/shared/services/storage/access-token-storage";
import { NOTIFICATION_PREFERENCES_QUERY_KEY } from "../hooks/use-notification-preferences";
import { notificationPreferencesService } from "../services/notification-preferences.service";

const getServerToken = () => null;

export function PushSubscriptionSync() {
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);
  const { environment, sync } = usePushNotifications();
  const hasSynced = useRef(false);

  const { data: preferences } = useQuery({
    queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    queryFn: () => notificationPreferencesService.get(),
    enabled: !!token && environment === "supported",
  });

  useEffect(() => {
    if (!token) {
      hasSynced.current = false;
      return;
    }
    if (hasSynced.current || environment !== "supported") return;
    if (!preferences?.pushEnabled) return;

    hasSynced.current = true;
    void sync();
  }, [token, environment, preferences?.pushEnabled, sync]);

  return null;
}