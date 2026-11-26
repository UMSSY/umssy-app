"use client";

import { useCallback, useEffect, useState } from "react";
import { BEARER_PREFIX } from "@/shared/constants/auth.constants";
import { apiClient } from "@/shared/services/api-client";
import { urlBase64ToUint8Array } from "@/shared/utils/url-base64-to-uint8-array";
import type {
  PushEnvironment,
  PushPermissionState,
  ActivateResult,
  PushSyncSession,
  UsePushNotificationsResult,
} from "@/shared/types/use-push-notifications.types";
import { subscribeToPush } from "../utils/subscribe-to-push";

const SERVICE_WORKER_READY_TIMEOUT_MS = 10_000;

async function waitForServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), SERVICE_WORKER_READY_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function ensureBackendSubscription(
  registration: ServiceWorkerRegistration,
  session?: PushSyncSession,
): Promise<void> {
  const requestConfig = session
    ? {
        ...(session.token
          ? { headers: { Authorization: `${BEARER_PREFIX}${session.token}` } }
          : {}),
        signal: session.signal,
      }
    : undefined;
  const existingSubscription = await registration.pushManager.getSubscription();

  const subscription =
    existingSubscription ??
    (await (async () => {
      const response = requestConfig
        ? await apiClient.get<{ data: { publicKey: string } }>("/push/public-key", requestConfig)
        : await apiClient.get<{ data: { publicKey: string } }>("/push/public-key");
      const publicKey = response.data?.data?.publicKey;
      if (!publicKey) throw new Error("VAPID public key no disponible");
      return subscribeToPush(registration, urlBase64ToUint8Array(publicKey));
    })());

  session?.signal.throwIfAborted();

  const { keys } = subscription.toJSON();
  const body = {
    endpoint: subscription.endpoint,
    keys: { p256dh: keys?.p256dh, auth: keys?.auth },
    userAgent: navigator.userAgent,
  };

  if (requestConfig) {
    await apiClient.post("/push/subscriptions", body, requestConfig);
  } else {
    await apiClient.post("/push/subscriptions", body);
  }
}

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

    waitForServiceWorker()
      .then((registration) => registration?.pushManager.getSubscription() ?? null)
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
        return { ok: false, reason: "permission-blocked" };
      }

      if (currentPermission !== "granted") {
        currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);
      }

      if (currentPermission === "denied") {
        return { ok: false, reason: "permission-blocked" };
      }

      if (currentPermission !== "granted") {
        return { ok: false, reason: "permission-dismissed" };
      }

      const registration = await waitForServiceWorker();
      if (!registration) {
        return { ok: false, reason: "service-worker-unavailable" };
      }

      await ensureBackendSubscription(registration);

      setIsSubscribed(true);

      return { ok: true };
    } catch (error) {
      console.error("[usePushNotifications] Activation failed", error);

      return { ok: false, reason: "network-error" };
    } finally {
      setIsLoading(false);
    }
  }, [environment]);

  const sync = useCallback(async (session: PushSyncSession): Promise<boolean> => {
    if (environment !== "supported") return false;
    if (Notification.permission !== "granted") return false;

    try {
      const registration = await waitForServiceWorker();
      if (!registration || session.signal.aborted) return false;

      await ensureBackendSubscription(registration, session);
      if (session.signal.aborted) return false;

      setIsSubscribed(true);
      return true;
    } catch (error) {
      if (!session.signal.aborted) {
        console.warn("[usePushNotifications] Silent sync failed", error);
      }
      return false;
    }
  }, [environment]);

  const deactivate = useCallback(async (): Promise<void> => {
    if (environment !== "supported") return;

    setIsLoading(true);

    try {
      const registration = await waitForServiceWorker();
      const subscription =
        (await registration?.pushManager.getSubscription()) ?? null;

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
    sync,
    deactivate,
  };
}
