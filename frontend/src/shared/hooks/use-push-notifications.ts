"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/shared/services/api-client";
import { urlBase64ToUint8Array } from "@/shared/utils/url-base64-to-uint8-array";
import type {
  PushEnvironment,
  PushPermissionState,
  ActivateResult,
  UsePushNotificationsResult,
} from "@/shared/types/use-push-notifications.types";
import { subscribeToPush } from "../utils/subscribe-to-push";

function detectEnvironment(): PushEnvironment {
  if (typeof window === "undefined") return "unsupported";

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);

  if (isIOS) {
    const match = ua.match(/OS (\d+)_(\d+)/);

    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);

      if (major < 16 || (major === 16 && minor < 4)) {
        return "ios-old";
      }
    }

    const nav = window.navigator as Navigator & {
      standalone?: boolean;
    };

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;

    if (!isStandalone) {
      return "ios-not-installed";
    }
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }

  const isDesktop = !/Android|iPhone|iPad|iPod/i.test(ua);

  return isDesktop ? "desktop" : "supported";
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [environment] = useState<PushEnvironment>(detectEnvironment);

  const [permission, setPermission] = useState<PushPermissionState>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "default";
    }

    return Notification.permission;
  });

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (environment !== "supported") return;

    let isMounted = true;

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (isMounted) {
          setIsSubscribed(!!subscription);
        }
      })
      .catch((error) => {
        console.error(
          "[usePushNotifications] Error checking initial subscription",
          error,
        );
      });

    return () => {
      isMounted = false;
    };
  }, [environment]);

  const activate = useCallback(async (): Promise<ActivateResult> => {
    if (environment !== "supported") {
      return { ok: false, reason: environment };
    }

    setIsLoading(true);

    try {
      let currentPermission = Notification.permission;

      setPermission(currentPermission);

      if (currentPermission === "denied") {
        return { ok: false, reason: "permission-denied" };
      }

      if (currentPermission !== "granted") {
        currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);
      }

      if (currentPermission !== "granted") {
        return { ok: false, reason: "permission-denied" };
      }

      const registration = await navigator.serviceWorker.ready;

      const existingSubscription =
        await registration.pushManager.getSubscription();

      const subscription =
        existingSubscription ??
        (await (async () => {
          const response = await apiClient.get<{
            data: { publicKey: string };
          }>("/push/public-key");

          const applicationServerKey = urlBase64ToUint8Array(
            response.data?.data?.publicKey ?? "",
          );

          return subscribeToPush(registration, applicationServerKey);
        })());

      await apiClient.post("/push/subscriptions", {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.toJSON().keys?.p256dh,
          auth: subscription.toJSON().keys?.auth,
        },
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);

      return { ok: true };
    } catch (error) {
      console.error("[usePushNotifications] Activation failed", error);

      return { ok: false, reason: "network-error" };
    } finally {
      setIsLoading(false);
    }
  }, [environment]);

  const deactivate = useCallback(async (): Promise<void> => {
    if (environment !== "supported") return;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      await apiClient.delete("/push/subscriptions", {
        data: { endpoint: subscription.endpoint },
      });

      await subscription.unsubscribe();

      setIsSubscribed(false);
    } catch (error) {
      console.error("[usePushNotifications] Deactivation failed", error);
    } finally {
      setIsLoading(false);
    }
  }, [environment]);

  return {
    environment,
    permission,
    isSubscribed,
    isLoading,
    activate,
    deactivate,
  };
}