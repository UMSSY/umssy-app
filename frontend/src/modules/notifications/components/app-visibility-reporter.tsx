"use client";

import { useAppVisibilityReport } from "../hooks/use-app-visibility-report";
import { useNotificationToasts } from "../hooks/use-notification-toasts";

export function AppVisibilityReporter() {
  useAppVisibilityReport();
  useNotificationToasts();
  return null;
}
