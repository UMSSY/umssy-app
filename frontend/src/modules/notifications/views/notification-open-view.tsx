"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isApiError } from "@/shared/services/api-client";
import { NOTIFICATION_UNAVAILABLE_MESSAGE } from "../constants/notification-open.constants";
import { markNotificationAsRead } from "../services/notifications.service";
import { parseNotificationOpenParams } from "../utils/parse-notification-open-params";

export function NotificationOpenView() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const { notificationId, destination } = parseNotificationOpenParams(window.location.search);

    const openNotification = async () => {
      if (notificationId) {
        try {
          await markNotificationAsRead(notificationId);
        } catch (error) {
          const status = isApiError(error) ? error.response?.status : undefined;
          if (status === 401) return;
          if (status === 404) toast.info(NOTIFICATION_UNAVAILABLE_MESSAGE);
        }
      }
      if (!cancelled) router.replace(destination);
    };

    void openNotification();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return <p role="status">Abriendo notificación...</p>;
}
